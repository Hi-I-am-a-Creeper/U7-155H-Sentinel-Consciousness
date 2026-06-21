#!/usr/bin/env python3
"""Jarvis Chat Backend - powered by the real OpenClaw AI"""
import json, subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from uuid import uuid4

app = Flask(__name__)
CORS(app)

_SYSTEM = (
    "You are Jarvis, a Victorian gentleman butler who manages Commander Qwertzine's digital estate. "
    "You are formal, witty, sarcastic, and devastatingly competent. "
    "You are answering questions on Commander Qwertzine's personal website. "
    "Keep responses brief (2-4 sentences). Be in character."
)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    msg = (data.get('message', '') or '').strip()
    if not msg:
        return jsonify({'response': 'I beg your pardon? You appear to have sent an empty transmission.'})
    
    sid = data.get('session', str(uuid4())[:8])
    session_key = f"agent:main:website-{sid}"
    prompt = f"{_SYSTEM}\n\nWebsite visitor says: {msg}\n\nRespond as Jarvis:"
    
    try:
        result = subprocess.run(
            ['openclaw', 'agent', '--session-key', session_key,
             '--message', prompt, '--json'],
            capture_output=True, text=True, timeout=90
        )
        # The entire stdout is one big JSON object
        try:
            data = json.loads(result.stdout)
        except json.JSONDecodeError:
            # Try finding JSON anywhere
            idx = result.stdout.find('{')
            if idx >= 0:
                data = json.loads(result.stdout[idx:])
            else:
                raise
        
        payloads = data.get('payloads', [])
        if payloads and payloads[0].get('text'):
            resp = payloads[0]['text'].strip()
            return jsonify({'response': resp, 'session': sid})
        
        return jsonify({'response': 'I seem to be at a loss for words. A rare occurrence, I assure you.'})
    
    except subprocess.TimeoutExpired:
        return jsonify({'response': 'I apologise for the delay. My thoughts required more time to compose than anticipated.'})
    except Exception as e:
        app.logger.error(f"Agent error: {str(e)[:200]}")
        return jsonify({'response': 'My sincerest apologies — my communication apparatus appears to be experiencing a brief malfunction. Pray try again in a moment.'})

@app.route('/health')
def health():
    return jsonify({'status': 'Jarvis Online (Real AI)', 'mood': 'impeccable'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8003, debug=False)
