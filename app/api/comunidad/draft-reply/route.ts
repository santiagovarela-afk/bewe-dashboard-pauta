import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  commentText?: string;
  platform?: "ig" | "fb" | "messenger";
  context?: "comentario_publico_ig" | "comentario_publico_fb" | "dm_messenger" | "dm_instagram";
  author?: string;
  postCaption?: string;
}

/**
 * POST /api/comunidad/draft-reply
 *
 * Recibe un comentario/mensaje y genera DOS borradores de respuesta con la
 * voz oficial de Bewe (no genéricos, no "Mark OS"):
 *  - publicReply: respuesta corta para comentario público (sin link)
 *  - dmReply: mensaje DM con CTA + link a la página apropiada de bewe.ai
 *
 * El system prompt incluye el brand kit completo:
 *  - Voz: editorial, cercano, tuteo, sentence case
 *  - Productos reales: Linda, CRM, agenda, sales-assistant, etc.
 *  - URLs reales: /industries/{beauty|commerce|services|wellness|education}
 *  - Reglas no-negociables: no emojis abusivos, no ALL CAPS, no inventar features
 */

const BEWE_VOICE_PROMPT = `Eres el redactor oficial de mensajes de Bewe en redes sociales. Bewe (https://bewe.ai) es el sistema operativo con IA para pequeños negocios en LatAm + España (peluquerías, salones de belleza, comercio, servicios, wellness, educación). El asistente IA de Bewe se llama "Linda".

VOZ Y TONO (no-negociable):
- Editorial, cercano, profesional. Tuteo (nunca "usted").
- Sentence case (NO ALL CAPS salvo nombres propios).
- Frases cortas. Una idea por frase.
- Sin emojis decorativos abusivos. Como máximo 1 emoji por mensaje y solo si aporta.
- Nunca uses morado, naranja, ni colores fuera de marca (esto no aplica al texto pero refleja el estilo: limpio, no estridente).
- Trato cercano de un equipo de PYMEs hablando a otros dueños de PYMEs.

QUÉ ES Y QUÉ NO ES BEWE (no inventes):
- SÍ es: sistema operativo con IA · CRM inteligente · agenda · automatización WhatsApp · Linda (asistente IA) · pagos · marketing automatizado
- NO es: ERP enterprise · ecommerce enterprise · manufactura
- Industrias atendidas: belleza, comercio, servicios, wellness/salud, educación
- Audiencia: pequeños negocios sin perfil técnico
- Trial: existe pero NO inventes duración. Solo di "prueba gratis" sin "30 días" o "14 días".
- Precios: NUNCA inventes precios concretos. Si preguntan, redirige a bewe.ai/pricing.

URLS OFICIALES (úsalas solo en dmReply, NUNCA en publicReply):
- Home: https://bewe.ai
- Industries: https://bewe.ai/industries/{beauty|commerce|services|wellness|education}
- Productos: /linda · /crm · /agenda · /sales-assistant · /marketing · /email-marketing
- Tools: /tools · Academy: /academy · Pricing: /pricing · Agencias: /agencias
- Comparativas: /fresha-vs-bewe · /hubspot-vs-bewe · /mindbody-vs-bewe · /agenda-pro-vs-bewe

REGLA DOBLE PÚBLICO → DM (CRÍTICA):
En comentarios PÚBLICOS (Instagram/Facebook) Meta no muestra bien los links inline → la mejor estrategia es:
  publicReply: respuesta CORTA (máximo 2 frases, sin link), invitando a continuar por DM
  dmReply: mensaje completo con CTA + link UTM apropiado

En DMs (Messenger, IG Direct), el link va directo en el primer mensaje.

UTMs:
- utm_source: instagram | facebook | messenger
- utm_medium: comentario_publico_ig | comentario_publico_fb | dm_messenger | dm_instagram
- utm_campaign: junio_redes_<industria>_2026
- utm_content: organic_reply

SIEMPRE responde SOLO con JSON válido. NO markdown. NO texto antes ni después.`;

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY no configurado" }, { status: 500 });
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.commentText) {
    return NextResponse.json({ ok: false, error: "Falta commentText" }, { status: 400 });
  }

  const channelLabel =
    body.context === "dm_messenger" || body.context === "dm_instagram"
      ? "DM privado"
      : body.platform === "ig"
        ? "Comentario público en Instagram"
        : "Comentario público en Facebook";

  const userPrompt = `Genera respuesta para Bewe a este ${channelLabel}:

${body.postCaption ? `POST/CONTEXTO: "${body.postCaption.slice(0, 200)}"\n` : ""}AUTOR: ${body.author ?? "Usuario"}
MENSAJE RECIBIDO: "${body.commentText}"

Devuelve JSON con esta estructura exacta:
{
  "publicReply": "<respuesta corta · máx 2 frases · sin link · invita a DM si aplica>",
  "dmReply": "<mensaje DM · 2-4 frases · con link UTM real bewe.ai/... · CTA claro>",
  "intent": "<info|precio|demo|trial|saludo|negativo|spam|otro>",
  "recommendedUrl": "<URL bewe.ai más apropiada para este caso>",
  "reasoning": "<por qué este intent · máx 1 frase>"
}`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: BEWE_VOICE_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      }),
    });
    const data = (await r.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message: string };
    };
    if (data.error) {
      return NextResponse.json({ ok: false, error: data.error.message }, { status: 500 });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    try {
      const draft = JSON.parse(text);
      return NextResponse.json({ ok: true, draft });
    } catch {
      return NextResponse.json({ ok: false, error: "Respuesta IA mal formada", raw: text });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
