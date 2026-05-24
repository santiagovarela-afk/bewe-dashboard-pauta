# Bewe · Creative Docs

> Carpeta donde subes el material creativo y de marca. Mark/Lúa OS y
> Open Design los leen automáticamente y los usan como contexto para:
> - Generar ideas de posts (Parrilla → Idea Generator)
> - Generar diseños (Open Design)
> - Sugerencias de copy, tono, hashtags
> - Respuestas en el chat con tono Bewe correcto

## Cómo funciona el loader

1. Pones archivos `.md` o `.txt` en esta carpeta
2. El loader (`lib/creative-docs.ts`) los lee en server-side
3. Se cachean **10 minutos**
4. Se inyectan al **system prompt** de:
   - `/api/gemini` → Mark/Lúa chat
   - `/api/design/generate` → Open Design
5. Cuando agregas/editas un doc, podés forzar reload sin reiniciar:
   ```bash
   curl -X POST http://localhost:3000/api/creative-docs \
     -H "Content-Type: application/json" \
     -d '{"action":"reload"}'
   ```
6. Para ver qué docs están cargados:
   ```bash
   curl http://localhost:3000/api/creative-docs
   ```

## Formatos aceptados

| Formato | Soportado | Notas |
|---|---|---|
| `.md` | ✅ | Preferido · markdown puro |
| `.txt` | ✅ | Texto plano |
| `.docx` | ❌ | Binario · NO se lee · re-exportá como `.md` o `.txt` |
| `.pdf`  | ❌ | NO soportado en esta versión |
| imágenes | ❌ | NO se procesan · sólo texto |

> ⚠️ El archivo `bewe_design_guideline.md.docx` que subiste **no se está
> leyendo** porque es Word (`.docx`). Abrílo en Word → "Guardar como" →
> elegí "Texto sin formato (.txt)" o pegá el contenido en un nuevo `.md`.

## Límites

- Cada doc se trunca a **12.000 caracteres** si excede
- Total combinado: **40.000 caracteres** (safety net)
- Si pasás eso, se cortan los últimos docs · ponelos por prioridad

## Estructura recomendada

```
_docs/creative/
├── README.md                           ← este archivo (se ignora)
├── brand-guide.md                      ← guía visual · tipo · color · don'ts
├── tono-de-voz.md                      ← cómo habla Bewe · frases prohibidas
├── brief-mensual-may-2026.md           ← brief de campaña vigente
├── IAparaPymes-Canva-Brief.md          ← brief del live show ✅
└── posts-ejemplares.md                 ← descripción de tus mejores posts
```

## Cómo verificar que Mark/Lúa los está usando

1. Subí un brief con una palabra muy específica (ej. "TacoBell-violet")
2. Abrí Mark/Lúa
3. Preguntá: *"qué color debo usar para el CTA principal?"*
4. Si responde mencionando esa palabra, el contexto está enchufado ✅

## Cómo limpiar el cache forzado

Si editaste un doc y querés que el cambio se note YA:
```bash
curl -X POST http://localhost:3000/api/creative-docs -d '{"action":"reload"}'
```

O simplemente reiniciá `npm run dev`.
