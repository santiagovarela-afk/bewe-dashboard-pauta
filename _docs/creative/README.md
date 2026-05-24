# Bewe · Creative Docs

> Carpeta donde subes el material creativo y de marca. Mark/Lúa OS lo leen
> automáticamente al arrancar el dev server y lo usan como contexto para:
> - Generar ideas de posts (Parrilla → Idea Generator)
> - Generar diseños (Open Design)
> - Sugerencias de copy y hashtags
> - Tono y voz al responder en el chat

## Estructura sugerida

```
_docs/creative/
├── README.md                           ← este archivo
├── brief-creativo-may-2026.md          ← el brief mensual de pauta
├── bewe-design-guide.md                ← guía visual / tipografía / colores / do's & don'ts
├── tono-de-voz.md                      ← cómo habla Bewe (slogans, frases prohibidas, etc)
├── canva-templates-pymes.md            ← referencias de templates Canva que funcionan
├── posts-ejemplares/
│   ├── ig-belleza-octubre.png          ← screenshots o links de tus mejores posts
│   ├── fb-comercio-marzo.png
│   └── reels-servicios.md              ← URLs de reels con buenos resultados
└── briefs-mensuales/
    ├── may-2026.md
    ├── jun-2026.md
    └── ...
```

## Formatos aceptados

- `.md` · markdown (preferido · Mark lo lee directo)
- `.txt` · texto plano
- `.png` / `.jpg` / `.webp` · imágenes de referencia
- `.pdf` · documentos largos (Mark los lee si están bajo 10MB)
- `.json` · si tienes brand kit estructurado

## Cómo se integra con Mark/Lúa

Cuando inicia el dev server, un loader lee todos los `.md` de esta carpeta y
los agrega como contexto adicional al system prompt de Mark/Lúa. No hace falta
configurar nada · solo poner archivos aquí y reiniciar `npm run dev`.

Para forzar reload sin reiniciar:
```bash
curl -X PUT http://localhost:3000/api/ai-memory -d '{"action":"reload-creative-docs"}'
```

(El endpoint lo construyo en el siguiente turno si lo necesitas).
