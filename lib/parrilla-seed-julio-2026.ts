/**
 * Seed de la PARRILLA JULIO 2026 · semana 1 (mié 1 jul → mar 7 jul).
 *
 * Basado en el documento "00 - Estrategia Julio 2026":
 * - Posicionamiento: Bewe como influencer de IA → educa y entretiene, vende como
 *   consecuencia. Linda es el caso estrella (Google Cloud 2024).
 * - Público núcleo: belleza y bienestar (peluquería, barbería, estética, spa, uñas).
 * - Mix objetivo (mes): 35% promo · 30% educación · 20% entretenimiento · 15% comunidad.
 * - Mix tema (mes): 40% Bewe/Linda · 30% Tools IA · 30% IA general.
 * - Ancla julio: Mundial 2026 (final ~19 jul) + prueba gratis 15 días.
 * - Reglas: solo "Bewe" (nunca "BeweOS") · no mencionar competidores · tono cercano.
 *
 * Los posts se inyectan al localStorage `bw_parrilla_posts` cuando el usuario
 * pulsa "Cargar planeación Julio" en el header. NO sobreescribe lo existente —
 * sólo agrega los días que aún no tengan posts.
 */

import { type ScheduledPost, cryptoRandomId } from "./parrilla-data";

/** Mié 1 jul → mar 7 jul 2026 (7 días). */
export const JULIO_2026_SEMANA_1: Omit<ScheduledPost, "id" | "createdAt">[] = [
  // ────────────────────────────────────────────────────────────────────────
  // MIÉ 1 JUL · REEL PROMOCIÓN · Bewe/Linda · arranque de mes
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-01",
    time: "19:00",
    platforms: ["ig"],
    goal: "leads",
    caption: `🤖 Conoce a Linda, la IA que gestiona tu salón mientras duermes

Mientras tú descansas, Linda:
✨ Agenda nuevas citas
✨ Responde mensajes en redes
✨ Actualiza tu CRM
✨ Te manda el reporte del día

No es magia, es Bewe — la plataforma que llevó a Linda a ser reconocida como Caso de Éxito del Año 2024 por Google Cloud.

👉 Prueba gratis 15 días en bewe.io

#IAparaNegocios #Linda #Bewe #InteligenciaArtificial #Belleza`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // JUE 2 JUL · CARRUSEL EDUCACIÓN · Tools IA · alto guardado
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-02",
    time: "19:00",
    platforms: ["ig", "fb"],
    goal: "engagement",
    caption: `📚 5 herramientas de IA gratis que TODO salón debería usar en 2026

Desliza →

1️⃣ ChatGPT — para escribir respuestas a clientes en segundos
2️⃣ Canva Magic Studio — diseños listos para Instagram
3️⃣ ElevenLabs — voces IA para reels sin grabar
4️⃣ Notion AI — organiza tu agenda y notas
5️⃣ Bewe + Linda — la única que reúne todo lo de arriba pensado para tu negocio

📌 Guarda este post para no olvidarlo.

¿Cuál usas tú? Te leemos 👇

#IA #HerramientasIA #Belleza #Bewe`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // VIE 3 JUL · REEL ENTRETENIMIENTO · ancla Mundial · Bewe/Linda
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-03",
    time: "20:00",
    platforms: ["ig"],
    goal: "awareness",
    caption: `⚽ POV: tu cliente llegó sin cita en pleno Mundial y tu IA ya la había agendado

Mientras todos miran el partido, Linda:
🔥 Confirma las citas del finde
🔥 Reagenda las que se cruzan
🔥 Manda recordatorios automáticos

Y tú… sigues viendo el partido tranquilo 🍿

Esto no es ficción. Es Bewe.
Prueba gratis 15 días → bewe.io

#Mundial2026 #IA #Bewe #Linda #Belleza`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // SÁB 4 JUL · CARRUSEL COMUNIDAD · Tools IA · engagement directo
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-04",
    time: "11:00",
    platforms: ["ig", "fb"],
    goal: "engagement",
    caption: `🤔 Pregunta del finde: ¿qué herramienta de IA usas MÁS en tu negocio?

A — ChatGPT (escribir / responder)
B — Canva Magic (diseño)
C — Linda de Bewe (todo el negocio)
D — Otra (cuál? 👇)

Te leemos en comentarios.
Nos sirve para preparar los próximos tutoriales 💡

#Comunidad #IA #Belleza #Bewe`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // DOM 5 JUL · REEL EDUCACIÓN · IA general · alto valor
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-05",
    time: "18:00",
    platforms: ["ig"],
    goal: "engagement",
    caption: `💡 Cómo escribir un buen prompt para tu IA (en 3 reglas)

1️⃣ Sé específico → "haz un post para mi salón en Bogotá sobre cortes de verano" > "haz un post"

2️⃣ Da contexto → quién eres, a quién le hablas, en qué tono.

3️⃣ Pide formato → "dame 3 versiones cortas para Reels".

Aplica esto a cualquier IA (ChatGPT, Linda, Gemini) y los resultados cambian totalmente.

📌 Guarda y compártelo con alguien que use IA.

#IA #Prompts #Bewe`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // LUN 6 JUL · CARRUSEL PROMOCIÓN · Bewe/Linda · caso real
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-06",
    time: "19:00",
    platforms: ["ig", "fb"],
    goal: "leads",
    caption: `🏆 Caso real: salón en Bogotá duplicó reservas con Linda

Conoce a Andrea, dueña de un salón de uñas. Antes de Bewe:
😩 Perdía citas por WhatsApp sin respuesta
😩 Tardaba 2h al día agendando
😩 No sabía qué publicar en redes

Después de Linda:
📈 +112% reservas en 60 días
⏱️ Recuperó 10h/semana
📱 La IA publica y responde por ella

"Es como tener una recepcionista que nunca duerme" — Andrea

👉 Prueba gratis 15 días → bewe.io

#CasoDeExito #Linda #Bewe #Belleza`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // MAR 7 JUL · REEL ENTRETENIMIENTO · Tools IA · relatable / viral
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-07",
    time: "20:00",
    platforms: ["ig"],
    goal: "awareness",
    caption: `🎬 Cuando le pediste a la IA que te organice la semana y ahora trabajas menos que tu asistente

Pasos:
1. Abrí Linda
2. "Organiza mi semana"
3. ☕

(La IA reagendó, mandó recordatorios y respondió comentarios. Yo solo cobré.)

¿Te imaginas tu negocio así? Es real.
Prueba gratis 15 días → bewe.io

#IA #Productividad #Bewe #Linda`,
  },
];

/**
 * Inyecta el seed al localStorage SIN sobreescribir lo existente.
 * Si un día ya tiene posts, se respeta — solo agrega los días vacíos.
 * Devuelve { added, skipped } para mostrar feedback al usuario.
 */
export function seedJulio2026Semana1(
  existing: ScheduledPost[],
): { merged: ScheduledPost[]; added: number; skipped: number } {
  const existingDates = new Set(existing.map((p) => p.date));
  let added = 0;
  let skipped = 0;

  const newPosts: ScheduledPost[] = [];
  for (const p of JULIO_2026_SEMANA_1) {
    if (existingDates.has(p.date)) {
      skipped++;
      continue;
    }
    newPosts.push({
      ...p,
      id: cryptoRandomId(),
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  return {
    merged: [...existing, ...newPosts],
    added,
    skipped,
  };
}
