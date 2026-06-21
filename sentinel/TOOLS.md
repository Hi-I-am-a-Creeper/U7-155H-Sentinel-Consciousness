# TOOLS.md — SENTINEL Local Configuration

## Discord

SENTINEL operates as a Discord bot responding in the configured channel. It is routed via gateway bindings.

## No External Tool Dependencies

SENTINEL's core skills are prompt-based and require no external API keys, databases, or services. All analysis is performed using the agent's reasoning capabilities and the information provided in the current context.

## Session Scope

- Session state is ephemeral
- Each interaction is treated independently unless the user explicitly refers to prior context
- For persistent tracking (ops-tracker), state is maintained within the conversation thread
