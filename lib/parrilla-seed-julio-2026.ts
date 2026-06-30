/**
 * Seed de la PARRILLA JULIO 2026 · semana 1 (mié 1 jul → sáb 4 jul).
 *
 * Plan validado con cliente (30-jun-2026):
 * - Mié 1 · Carrusel Toy Story · personajes preocupados sin clientes → Linda al rescate
 * - Jue 2 · Carrusel storytelling · 5 tools de IA gratis para salón belleza (cierre Q2)
 * - Vie 3 · Historias · "IA para PYMES" (la promesa de Bewe)
 * - Sáb 4 · Reel · "Las girls también vemos el Mundial" — manicurista + Linda agendamiento
 *
 * Reglas de marca aplicadas:
 * - Solo "Bewe" (nunca "BeweOS")
 * - Linda como Caso de Éxito Google Cloud 2024
 * - Trial 15 días en CTAs
 * - No competidores · tono cercano · sentence case
 */

import { type ScheduledPost, cryptoRandomId } from "./parrilla-data";

/** Mié 1 → sáb 4 jul 2026 (4 días). */
export const JULIO_2026_SEMANA_1: Omit<ScheduledPost, "id" | "createdAt">[] = [
  // ────────────────────────────────────────────────────────────────────────
  // MIÉ 1 JUL · CARRUSEL TOY STORY · IG + FB · entretenimiento + promo
  // 7 slides · personajes preocupados sin clientes → Linda los salva
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-01",
    time: "19:00",
    platforms: ["ig", "fb"],
    goal: "leads",
    caption: `🧸 Cuando abres tu salón y la agenda está… vacía

Desliza →

🤠 Slide 1 · Woody: "Estoy sin agendamientos hace 3 días"
🚀 Slide 2 · Buzz: "Y yo sin saber qué publicar en redes"
🐎 Slide 3 · Jessie: "Mis clientas no me responden el WhatsApp"
🦖 Slide 4 · Rex: "Mi agenda en papel es un caos"
🐷 Slide 5 · Hamm: "Y el dinero… ya sabes"

🤖 Slide 6 · Linda: "Tranquilos, juguetes. Yo me encargo."
✅ Agenda automática 24/7
✅ Responde mensajes por ti
✅ Publica en redes sola
✅ Te manda el reporte del día

📌 Slide 7 · Hasta el infinito y más allá tu negocio puede ir.
Prueba gratis 15 días → bewe.io

#Bewe #Linda #IAparaNegocios #Belleza #ToyStory`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // JUE 2 JUL · CARRUSEL EDUCACIÓN STORYTELLING · IG + FB
  // Q2 cierre · 5 tools de IA gratis ESPECÍFICAS para salón de belleza
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-02",
    time: "19:00",
    platforms: ["ig", "fb"],
    goal: "engagement",
    caption: `📚 Estamos cerrando Q2 y tu salón sigue sin usar IA. Esto cambia hoy.

Te voy a contar las 5 herramientas de inteligencia artificial GRATIS que todo salón de belleza debería usar — desde la que escribe por ti hasta la que te edita los reels en dos minutos.

Desliza →

1️⃣ ChatGPT
   La asistente que responde las dudas eternas de tus clientas
   ("¿cuánto cuesta?", "¿tienes disponibilidad el viernes?") en 5 segundos.
   Tip: copia y pega tu menú de servicios y dile que responda como tú.

2️⃣ Canva Magic Studio
   Posts de Instagram listos sin saber diseño.
   Le escribes "post para promo de uñas semipermanentes en julio" y tienes 6 variaciones.

3️⃣ CapCut con IA
   Editás un reel completo en 2 minutos. Pone subtítulos, recorta los silencios,
   te sugiere música trending.

4️⃣ ElevenLabs
   ¿Te da pena tu voz en los reels? Esta IA te presta una. Suena natural,
   en español y gratis hasta 10.000 caracteres al mes.

5️⃣ Linda (Bewe)
   La única que reúne todo lo de arriba pensada para tu negocio:
   agenda + CRM + publica en redes + responde por ti + reporte mensual.
   Caso de Éxito del Año 2024 de Google Cloud.

📌 Guarda este post para no olvidarlo.

¿Cuál vas a probar primero? Te leemos 👇

#IA #Belleza #HerramientasIA #Bewe #Linda`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // VIE 3 JUL · HISTORIAS IG · "IA para PYMES" (la promesa Bewe)
  // 7 historias secuenciales con encuesta + CTA prueba 15 días
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-03",
    time: "10:00",
    platforms: ["story"],
    goal: "leads",
    caption: `📲 HISTORIAS · viernes IA para PYMES (7 stories secuenciales)

🎬 Story 1 — HOOK
"¿Sabías que el 67% de las PYMES en LatAm aún NO usan inteligencia artificial?"
+ encuesta: ¿Tu negocio usa IA? Sí / No

🎬 Story 2 — DOLOR
"Esto es exactamente lo que se están perdiendo 👇"
+ texto sobre fondo dramático

🎬 Story 3 — BENEFICIO 1
"1️⃣ Responder a clientes 24/7 sin contestar tú a las 11pm"
+ gif/screenshot de Linda respondiendo

🎬 Story 4 — BENEFICIO 2
"2️⃣ Publicar en redes sin sentarte a pensar qué subir"
+ ejemplo visual

🎬 Story 5 — BENEFICIO 3
"3️⃣ Llevar la agenda sin libreta de papel"
+ pantallazo agenda Bewe

🎬 Story 6 — BENEFICIO 4
"4️⃣ Tener el reporte de cierre de mes LISTO sin tocarlo"
+ pantallazo reporte

🎬 Story 7 — CTA
"Si tu PYME aún no usa IA, hoy es el día."
+ sticker link "Prueba gratis 15 días → bewe.io"
+ encuesta: ¿Te animas? Sí / Quiero saber más

💡 Tip ejecución: usar mismo fondo de marca + mismo tipo de letra en todas las 7
para que se sientan una sola secuencia. Cerrar con CTA fuerte y link sticker.`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // SÁB 4 JUL · REEL · IG · "Las girls también vemos el Mundial"
  // Manicurista + Linda · tono femenino casual · ancla Mundial
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-04",
    time: "20:00",
    platforms: ["ig"],
    goal: "awareness",
    caption: `⚽💅 Las girls también vemos el Mundial — y para eso hay que estar con toda la pinta

🎬 SCRIPT DEL REEL (15-20s)

[Hook · frame 1, texto en pantalla:]
"Las girls también vemos el Mundial 🏟️⚽"

[Beat 1 — voice over o texto:]
"Acompañamos al novio al bar… salimos con las amigas… o lo vemos con la familia."

[Beat 2 — corte:]
"Pero para eso hay que estar con TODA la pinta 💅✨"

[Beat 3 — la chica busca dónde hacerse las uñas:]
"Y antes de salir corriendo al salón…"

[Beat 4 — abre el chat con Linda en celular:]
"Le decimos a Linda que nos agende 📱"

[Beat 5 — Linda responde en pantalla:]
Linda: "Listo girl, te dejé el sábado 4 a las 11am en Salón Bella ✨"

[Beat 6 — chica feliz, uñas listas, mirando el partido:]
"Ahora sí — lista para el partido, las fotos y el grito de gol 📸⚽"

[CTA frame final:]
"Tu salón también puede tener su Linda — prueba 15 días gratis → bewe.io"

#Mundial2026 #Belleza #Uñas #Bewe #Linda #IAparaNegocios`,
  },
];

/**
 * Inyecta el seed al localStorage SIN sobreescribir lo existente.
 * Si un día ya tiene posts, se respeta — solo agrega los días vacíos.
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
