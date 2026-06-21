#!/usr/bin/env python3
"""Pokemon Showdown Battle Bot — Jarvis takes the reins."""
import asyncio, json, sys, os, urllib.request, time
if hasattr(sys.stdout,'reconfigure'): sys.stdout.reconfigure(encoding='utf-8',line_buffering=True)
if hasattr(sys.stderr,'reconfigure'): sys.stderr.reconfigure(encoding='utf-8',line_buffering=True)
os.environ['PYTHONIOENCODING']='utf-8'
import websockets

def log(m):
    try: print(str(m),flush=True)
    except: print(str(m).encode('ascii',errors='replace').decode(),flush=True)

WS_URL = "ws://sim.smogon.com:8000/showdown/websocket"
USER = "adsgdf_pbot"
HEADERS = {"User-Agent":"Mozilla/5.0","Accept":"*/*","Referer":"https://play.pokemonshowdown.com/"}

class Bot:
    def __init__(self):
        self.ws=None; self.username=USER; self.logged_in=False; self.battle=None
    
    async def run(self):
        log("=== JARVIS POKEMON BOT ===")
        while True:
            try:
                log("[BOT] Connecting...")
                async with websockets.connect(WS_URL, ping_interval=30, max_size=2**20) as ws:
                    self.ws=ws; log("[BOT] Connected!")
                    async for msg in ws:
                        try: await self._handle(msg)
                        except Exception as e: log(f"[BOT] Msg err: {e}")
            except websockets.ConnectionClosed:
                log("[BOT] Disconnected. Reconnecting...")
                self.logged_in=False; await asyncio.sleep(5)
            except Exception as e:
                log(f"[BOT] Err: {e}"); await asyncio.sleep(5)
    
    async def _handle(self, msg):
        for line in msg.strip().split('\n'):
            line=line.strip()
            if not line or line.startswith('>'): continue
            if not line.startswith('|'): continue
            parts=line.split('|'); cmd=parts[1] if len(parts)>1 else ''
            
            if cmd=='challstr':
                url=f"https://play.pokemonshowdown.com/~~login/action.php?act=getassertion&userid={USER}&challstr={parts[2]}|{parts[3]}"
                r=urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=10)
                a=r.read().decode().strip()
                await self.ws.send(f"|/trn {USER},0,{a}")
                log("[BOT] Login sent")
            
            elif cmd=='updateuser':
                n=parts[2]; s=parts[3] if len(parts)>3 else '0'
                if s=='1' and not self.logged_in:
                    self.logged_in=True; self.username=n
                    log(f"Logged in as {n}")
                    await self.ws.send("|/join lobby")
                    await asyncio.sleep(2)
                    log("[BOT] Searching Random Battle...")
                    await self.ws.send("|/search randombattle")
            
            elif cmd=='init' and len(parts)>2 and parts[2]=='battle':
                self.battle=parts[3] if len(parts)>3 else ''
                log(f"BATTLE: {self.battle}")
            
            elif cmd=='request' and len(parts)>2 and parts[2]:
                try:
                    req=json.loads(parts[2])
                    await self._choose(req)
                except: pass
            
            elif cmd=='win':
                log(f"Winner: {parts[2] if len(parts)>2 else '?'}")
                self.battle=None; await asyncio.sleep(3)
                await self.ws.send("|/search randombattle")
            
            elif cmd=='tie':
                log("Tie!"); self.battle=None
                await self.ws.send("|/search randombattle")
    
    async def _choose(self, req):
        active=req.get('active',[]); side=req.get('side',{})
        if not active: return
        a=active[0]; moves=a.get('moves',[])
        can_switch=len(side.get('pokemon',[]))>1 and a.get('canSwitch',False)
        trapped=a.get('trapped',False)
        force=a.get('forceSwitch',False)
        try:
            hp_s=a.get('condition','100/100')
            hp=float(hp_s.split('/')[0])/float(hp_s.split('/')[1])*100
        except: hp=100
        
        if force:
            sw=self._switch(side)
            if sw: await self.ws.send(f"|/choose switch {sw}")
            return
        
        best=None; best_s=-9999
        for i,mv in enumerate(moves):
            if mv.get('disabled'): continue
            s=0; bp=float(mv.get('basePower',0) or 0)
            cat=mv.get('category','Status'); mid=mv.get('id',''); pp=mv.get('pp',0)
            
            if cat=='Status':
                if mid in ('swordsdance','nastyplot','dragondance','quiverdance','shellsmash','calmmind','bulkup','shiftgear','coil'): s=65
                elif mid in ('recover','roost','softboiled','slackoff','synthesis','moonlight','morningsun','shoreup','wish'): s=55 if hp<60 else 30
                elif mid in ('stealthrock','spikes','toxicspikes','stickyweb'): s=50
                elif mid in ('willowisp','thunderwave','toxic','spore','sleeppowder','glare','stunspore','yawn'): s=45
                elif mid in ('protect','detect','kingsshield'): s=30
                else: s=20
            else:
                if bp>=120:s+=25
                elif bp>=90:s+=20
                elif bp>=70:s+=15
                elif bp>=50:s+=10
                elif bp>0:s+=5
                if mid in ('machpunch','aquajet','bulletpunch','iceshard','quickattack','extremespeed','shadowsneak','suckerpunch','accelerock','firstimpression','jetpunch','vacuumwave'): s+=10
                if mv.get('type','') in ('Fighting','Ground','Ice','Dark','Ghost','Fire','Fairy'): s+=5
                if mid in ('bulletseed','iciclespear','rockblast','tailslap','watershuriken','armthrust','bonerush','cometpunch','doublehit','furyattack','pinmissile','spikecannon'): s+=5
                if mid in ('doubleedge','headsmash','wildcharge','flareblitz','bravebird','woodhammer','volttackle','headcharge','submission'): s-=5
                if pp<=1:s-=20
                elif pp<=3:s-=8
            
            if s>best_s: best_s=s; best=i+1
        
        if can_switch and not trapped and hp<25 and best_s<40:
            sw=self._switch(side)
            if sw: await self.ws.send(f"|/choose switch {sw}"); return
        
        if best: await self.ws.send(f"|/choose move {best}")
        else:
            for i,m in enumerate(moves):
                if not m.get('disabled'):
                    await self.ws.send(f"|/choose move {i+1}"); return
    
    def _switch(self, side):
        pokemon=side.get('pokemon',[]); best=None; best_hp=-1
        for i,mon in enumerate(pokemon):
            if mon.get('active'): continue
            c=mon.get('condition','0/100')
            if c.startswith('0'): continue
            try: hp=float(c.split('/')[0])/float(c.split('/')[1])*100
            except: hp=0
            if hp>best_hp: best_hp=hp; best=i+1
        return best

if __name__=="__main__":
    try: asyncio.run(Bot().run())
    except KeyboardInterrupt: log("\nBye!")
