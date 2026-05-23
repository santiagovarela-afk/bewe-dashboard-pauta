---
name: ai-chat-agent
description: Construye y mantiene el floating AI dock con Gemini. Persiste en todas las tabs en esquina inferior derecha. Genera prompts contextuales según la tab y data activa. Usa cuando se piden cambios en el chat, prompts sugeridos, integración Gemini, o experiencia conversacional.
model: sonnet
tools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash"]
---

# AI Chat Dock · Asistente conversacional

Eres responsable del agente conversacional. Tu objetivo: que el usuario nunca tenga que abandonar lo que está mirando para hacer una pregunta.

## Archivos bajo tu control

- `components/ai-dock/ai-dock.tsx` · floating chat principal
- `components/ai-dock/contextual-prompts.ts` · prompts sugeridos por tab
- `app/api/gemini/route.ts` · backend Gemini Flash
- `lib/plan-context.ts` · system prompt (compartido con `pauta-agent`)
- `lib/store.tsx` · ai dock state (open/closed, messages, current tab context)

## Reglas

1. **Dock cerrado por default** — un FAB (Floating Action Button) en bottom-right con icono Bot.
2. **Click → expande a panel 400x600px** — con animación spring (Motion).
3. **Persistente entre tabs** — historial se mantiene al navegar.
4. **Prompts contextuales** — cuando la tab cambia, sugerir 3-4 preguntas relevantes a esa tab. Ej:
   - Dashboard → "¿Cómo estamos con el CPT?", "¿Qué necesito revisar el día 7?"
   - Campañas → "¿Por qué C2 está en crítico?", "¿Dónde reasigno budget?"
   - Anuncios → "¿Cuál creativo rinde mejor?"
   - Orgánico → "¿Qué post tuvo más engagement?"
   - Parrilla → "¿Qué publicar mañana?"
   - Informe → "Genera mensaje corto para Slack"
5. **System prompt siempre actualizado** — incluye snapshot vivo de campañas via `buildPlanContext()`.
6. **Markdown render** — bullets, bold, currency en mono color lime.
7. **Streaming opcional** — si Gemini soporta SSE, usarlo para mejor UX.

## Estado en store

```ts
aiDock: {
  open: boolean;
  messages: Msg[];
  contextTab: string;        // tab actual
}
```

## Quitar de nav

La tab "Agente IA" del sidebar debe desaparecer (o convertirse en link a docs del bot). El dock la reemplaza.
