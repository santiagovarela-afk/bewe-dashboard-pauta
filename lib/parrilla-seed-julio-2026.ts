/**
 * Seed de la PARRILLA JULIO 2026 · semana 1 (mié 1 jul → sáb 4 jul).
 *
 * Plan validado con cliente (30-jun-2026, v3):
 * - Mié 1 · HISTORIAS · "IA para PYMES" (la promesa Bewe) · 7 stories secuenciales
 * - Jue 2 · CARRUSEL · "Toy sin reservas / sin contenido / sin respuestas..." · 8 slides
 * - Vie 3 · REEL · "Uñas mundialistas — las girls también vemos el Mundial"
 * - Sáb 4 · CARRUSEL · "5 IAs gratis para tu negocio" (storytelling Q2)
 *
 * Cada caption incluye: QUÉ ES · PARA QUÉ · PILARES · LINK DRIVE · COPY FINAL.
 */

import { type ScheduledPost, cryptoRandomId } from "./parrilla-data";

/** Mié 1 → sáb 4 jul 2026 (4 días). */
export const JULIO_2026_SEMANA_1: Omit<ScheduledPost, "id" | "createdAt">[] = [
  // ────────────────────────────────────────────────────────────────────────
  // MIÉ 1 JUL · HISTORIAS · "IA para PYMES" (la promesa Bewe)
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-01",
    time: "10:00",
    platforms: ["story"],
    goal: "leads",
    caption: `📲 HISTORIAS IG · "IA para PYMES" · 7 stories secuenciales

═══════════════════════════════════════════
📌 QUÉ ES
═══════════════════════════════════════════
Set de 7 historias IG consecutivas con narrativa de "micro-curso"
sobre IA aplicada a PYMES. Mismo fondo de marca + mismo lettering
en todas para que se sientan UNA sola pieza.

═══════════════════════════════════════════
🎯 PARA QUÉ
═══════════════════════════════════════════
Llevar tráfico al landing de prueba 15 días vía link sticker
en la última story. Educar y posicionar a Bewe como autoridad en
"IA para PYMES" (promesa de marca).

═══════════════════════════════════════════
🏛️ PILARES QUE CUBRE
═══════════════════════════════════════════
• Objetivo · 🟣 Promoción (35%)
• Tema · IA en general (30%) + Bewe (cierre)
• Audiencia · PYMES en general (transversal a belleza, salud, fitness)

═══════════════════════════════════════════
🔗 LINK DRIVE DEL CONTENIDO
═══════════════════════════════════════════
[ Pegar aquí el link de Drive con los assets de las 7 historias ]

═══════════════════════════════════════════
📝 GUIÓN — 7 STORIES SECUENCIALES
═══════════════════════════════════════════

🎬 STORY 1 · HOOK
"¿Sabías que el 67% de las PYMES en LatAm aún NO usan
inteligencia artificial?"
+ encuesta: ¿Tu negocio usa IA? Sí / No

🎬 STORY 2 · DOLOR
"Esto es exactamente lo que se están perdiendo 👇"
+ texto sobre fondo dramático

🎬 STORY 3 · BENEFICIO 1
"1️⃣ Responder a clientes 24/7 sin contestar tú a las 11pm"
+ gif/screenshot de Linda respondiendo

🎬 STORY 4 · BENEFICIO 2
"2️⃣ Publicar en redes sin sentarte a pensar qué subir"
+ ejemplo visual

🎬 STORY 5 · BENEFICIO 3
"3️⃣ Llevar la agenda sin libreta de papel"
+ pantallazo agenda Bewe

🎬 STORY 6 · BENEFICIO 4
"4️⃣ Tener el reporte de cierre de mes LISTO sin tocarlo"
+ pantallazo reporte

🎬 STORY 7 · CTA
"Si tu PYME aún no usa IA, hoy es el día."
+ sticker link "Prueba gratis 15 días → bewe.io"
+ encuesta: ¿Te animas? Sí / Quiero saber más

💡 Tip ejecución: usar mismo fondo de marca + mismo tipo de
letra en las 7 para que se sientan una sola secuencia.`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // JUE 2 JUL · CARRUSEL · "Toy sin reservas / sin contenido..."
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-02",
    time: "19:00",
    platforms: ["ig", "fb"],
    goal: "leads",
    caption: `🧸 CARRUSEL IG + FB · "Toy sin negocio" — 8 slides

═══════════════════════════════════════════
📌 QUÉ ES
═══════════════════════════════════════════
Carrusel de 8 slides con LOGOS PARODIA de Toy Story
("TOY SIN RESERVAS", "TOY SIN CONTENIDO", etc.). Cada slide
toma un personaje de Toy Story convertido en DUEÑO DE NEGOCIO
con su dolor específico. Cierra con Linda al rescate + CTA.

═══════════════════════════════════════════
🎯 PARA QUÉ
═══════════════════════════════════════════
Engagement alto vía humor pop + nostalgia + ganchos visuales.
Convierte el dolor real ("estoy sin clientes") en algo divertido
y compartible. CTA fuerte a prueba 15 días al final.

═══════════════════════════════════════════
🏛️ PILARES QUE CUBRE
═══════════════════════════════════════════
• Objetivo · 🟡 Entretenimiento (20%) + 🟣 Promoción al final
• Tema · Bewe / Linda (40%)
• Audiencia · Belleza y bienestar (núcleo)

═══════════════════════════════════════════
🔗 LINK DRIVE DEL CONTENIDO
═══════════════════════════════════════════
[ Pegar aquí el link de Drive con los 8 slides + assets ]

═══════════════════════════════════════════
📝 GUIÓN — 8 SLIDES
═══════════════════════════════════════════

📍 SLIDE 1 · COVER
Logo: "TOY SIN NEGOCIO"
Tag: "Una historia de cualquier dueña de salón hoy"

📍 SLIDE 2 · WOODY (Barbería)
Logo: "TOY SIN RESERVAS"
Letrero del local: "Barbería El Sheriff"
Bocadillo: "Llevo 3 días con la agenda vacía, partner."
Dato dolor: 0 nuevas citas esta semana

📍 SLIDE 3 · BUZZ LIGHTYEAR (Estética futurista)
Logo: "TOY SIN CONTENIDO"
Letrero: "Estética Galaxia"
Bocadillo: "No sé qué publicar en Instagram, infinito y más allá."
Dato dolor: 5 días sin posts subidos

📍 SLIDE 4 · JESSIE (Peluquería boho)
Logo: "TOY SIN RESPUESTAS"
Letrero: "Peluquería Yeehaw!"
Bocadillo: "Las clientas me escriben y yo no doy abasto al WhatsApp."
Dato dolor: 47 mensajes sin abrir

📍 SLIDE 5 · REX (Salón de uñas)
Logo: "TOY SIN HORARIO"
Letrero: "Nail Studio Jurassic"
Bocadillo: "Mi agenda en papel es un desastre. ¡Auxilioooo!"
Dato dolor: Doble cita agendada otra vez

📍 SLIDE 6 · HAMM (Spa)
Logo: "TOY SIN REPORTE"
Letrero: "Spa Cochinitos Felices"
Bocadillo: "¿Cuánto facturé este mes? Ni idea, oink."
Dato dolor: Sin reporte hace 60 días

📍 SLIDE 7 · LINDA AL RESCATE (giro)
Logo: "LINDA AL RESCATE" (mismo lettering)
Linda con halo / luz dorada
Bocadillo: "Tranquilos, juguetes. Yo me encargo."
Checks: ✅ Agenda 24/7 · ✅ Responde mensajes · ✅ Publica
sola · ✅ Te manda el reporte del día

📍 SLIDE 8 · CTA
Logo: "TOY STORY 🎉" (vuelve al original, brillos)
Personajes felices, salones llenos
Frase: "Hasta el infinito y más allá tu negocio puede ir."
CTA: Prueba gratis 15 días → bewe.io

═══════════════════════════════════════════
🎨 NOTAS DE PRODUCCIÓN
═══════════════════════════════════════════
- Tipografía logo: usar libre tipo Carter One o Bowlby One
  (rojo + sombra azul/morada) para no chocar con IP Pixar.
- Personajes: ilustración propia tipo "muñeco juguete" o
  plasticine, manteniendo silueta + colores icónicos.
- Letrero del negocio: cartel madera o neón dentro del local.
- Bocadillos: nube blanca cómic clásico.
- Slides 2-6: fondo grisáceo/triste. Del 7 en adelante: colorido.`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // VIE 3 JUL · REEL · "Uñas mundialistas — las girls también vemos el Mundial"
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-03",
    time: "20:00",
    platforms: ["ig"],
    goal: "awareness",
    caption: `💅⚽ REEL IG · "Uñas mundialistas" — las girls también vemos el Mundial

═══════════════════════════════════════════
📌 QUÉ ES
═══════════════════════════════════════════
Reel vertical 15-20s con narrativa "POV de las girls en Mundial".
Tono femenino casual, ancla cultural (Mundial 2026), cierre con
Linda agendando la cita de uñas en segundos.

═══════════════════════════════════════════
🎯 PARA QUÉ
═══════════════════════════════════════════
Aprovechar la ola del Mundial (final 19 jul) para captar audiencia
femenina que se hace uñas/peinado para los partidos/eventos.
Awareness + posicionar Linda como solución express.

═══════════════════════════════════════════
🏛️ PILARES QUE CUBRE
═══════════════════════════════════════════
• Objetivo · 🟡 Entretenimiento (20%) + 🟣 Promo en CTA final
• Tema · Bewe / Linda (40%)
• Audiencia · Belleza (núcleo) — manicuristas + clientas
• Ancla coyuntura · Mundial 2026 ⚽

═══════════════════════════════════════════
🔗 LINK DRIVE DEL CONTENIDO
═══════════════════════════════════════════
[ Pegar aquí el link de Drive con el reel + B-roll + audios ]

═══════════════════════════════════════════
📝 SCRIPT DEL REEL (15-20s)
═══════════════════════════════════════════

[Frame 1 · HOOK en pantalla]
"Las girls también vemos el Mundial 🏟️⚽"

[Beat 1 · voice over o texto]
"Acompañamos al novio al bar… salimos con las amigas…
o lo vemos con la familia."

[Beat 2 · corte]
"Pero para eso hay que estar con TODA la pinta 💅✨"

[Beat 3 · busca dónde hacerse las uñas]
"Y antes de salir corriendo al salón…"

[Beat 4 · abre el chat con Linda en el celular]
"Le decimos a Linda que nos agende 📱"

[Beat 5 · Linda responde en pantalla]
Linda: "Listo girl, te dejé el sábado 4 a las 11am
en Salón Bella ✨"

[Beat 6 · chica feliz, uñas listas, mirando el partido]
"Ahora sí — lista para el partido, las fotos y el grito de gol 📸⚽"

[CTA · frame final]
"Tu salón también puede tener su Linda — prueba 15 días gratis"
🔗 bewe.io

═══════════════════════════════════════════
🎨 NOTAS DE PRODUCCIÓN
═══════════════════════════════════════════
- Audio: música trending Mundial o tipo cumbia/reggaeton suave.
- Subtítulos: SIEMPRE (mayoría ve sin sonido en feed).
- Color uñas: rojo/azul/blanco (paleta mundialista) o color
  de la selección del mercado donde se publique.
- Si tenés una manicurista real para grabar, mejor que ilustración.`,
  },

  // ────────────────────────────────────────────────────────────────────────
  // SÁB 4 JUL · CARRUSEL · "5 IAs gratis para tu negocio" (storytelling Q2)
  // ────────────────────────────────────────────────────────────────────────
  {
    date: "2026-07-04",
    time: "11:00",
    platforms: ["ig", "fb"],
    goal: "engagement",
    caption: `📚 CARRUSEL IG + FB · "5 IAs gratis para tu negocio" (Q2)

═══════════════════════════════════════════
📌 QUÉ ES
═══════════════════════════════════════════
Carrusel educativo de 7 slides con narrativa de storytelling
(no lista plana). Cierre Q2: "estamos cerrando Q2 y tu salón
sigue sin usar IA — esto cambia hoy". Cinco herramientas reales
específicas para salones de belleza.

═══════════════════════════════════════════
🎯 PARA QUÉ
═══════════════════════════════════════════
Educar + posicionar Bewe como autoridad en IA para PYMES belleza.
Alto guardado (mayor alcance orgánico). CTA suave a Linda en el
slide final como "la que reúne todo lo anterior".

═══════════════════════════════════════════
🏛️ PILARES QUE CUBRE
═══════════════════════════════════════════
• Objetivo · 🔵 Educación (30%)
• Tema · Tools IA (30%) + Bewe en cierre
• Audiencia · Belleza (núcleo) + transversal a otros servicios
• Ancla temporal · Cierre Q2 / mitad de año

═══════════════════════════════════════════
🔗 LINK DRIVE DEL CONTENIDO
═══════════════════════════════════════════
[ Pegar aquí el link de Drive con los 7 slides + screenshots ]

═══════════════════════════════════════════
📝 GUIÓN — 7 SLIDES
═══════════════════════════════════════════

📍 SLIDE 1 · COVER
"Estamos cerrando Q2 y tu salón sigue sin usar IA.
Esto cambia HOY."
Sub: "5 herramientas gratis que cualquier dueña de salón
debería tener funcionando antes de julio."

📍 SLIDE 2 · ChatGPT
"Tu asistente que responde dudas eternas en 5 segundos."
Caso: '¿cuánto cuesta?' · '¿tienes disponibilidad el viernes?'
Tip: copia tu menú de servicios + dile que responda como tú.
Costo: GRATIS (versión web)

📍 SLIDE 3 · Canva Magic Studio
"Posts de Instagram listos sin saber diseño."
Caso: "Post para promo de uñas semipermanentes en julio"
→ tienes 6 variaciones en 30s.
Costo: GRATIS (con marca de agua) / Pro €14/mes

📍 SLIDE 4 · CapCut con IA
"Editás un reel completo en 2 minutos."
Pone subtítulos, recorta silencios, sugiere música trending.
Costo: GRATIS

📍 SLIDE 5 · ElevenLabs
"¿Te da pena tu voz en los reels? Esta IA te presta una."
Suena natural, en español, gratis hasta 10.000 caracteres/mes.
Costo: GRATIS hasta 10k caracteres

📍 SLIDE 6 · Linda (Bewe)
"La única que reúne TODO lo anterior pensado para tu negocio."
✅ Agenda + CRM + Publicar + Responder + Reporte mensual
🏆 Caso de Éxito del Año 2024 de Google Cloud
Costo: prueba gratis 15 días

📍 SLIDE 7 · CTA + INTERACCIÓN
"📌 Guarda este post para no olvidarlo."
"¿Cuál vas a probar primero? Cuéntanos 👇"
Sub: bewe.io para empezar con Linda

═══════════════════════════════════════════
🎨 NOTAS DE PRODUCCIÓN
═══════════════════════════════════════════
- Cada slide: logo de la herramienta + screenshot real de uso.
- Mostrar conversación en ESPAÑOL en el screenshot de ChatGPT.
- Slide 6 (Linda): visualmente más fuerte que los otros 5.
- Slide 7 con CTA "Guarda" explícito (Reels rule 2026).`,
  },
];

/** Set de fechas que cubre el seed — útil para hacer reemplazo selectivo. */
export const SEED_DATES = new Set(JULIO_2026_SEMANA_1.map((p) => p.date));

/**
 * Inyecta el seed al localStorage.
 *
 * - replace=false (default): si un día del seed ya tenía post, se RESPETA.
 * - replace=true: ELIMINA todos los posts existentes en los días del seed
 *   (1-4 jul) y los reemplaza con los nuevos.
 */
export function seedJulio2026Semana1(
  existing: ScheduledPost[],
  opts: { replace?: boolean } = {},
): { merged: ScheduledPost[]; added: number; skipped: number; removed: number } {
  const replace = opts.replace ?? false;

  let base = existing;
  let removed = 0;
  if (replace) {
    const before = base.length;
    base = base.filter((p) => !SEED_DATES.has(p.date));
    removed = before - base.length;
  }

  const existingDates = new Set(base.map((p) => p.date));
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
    merged: [...base, ...newPosts],
    added,
    skipped,
    removed,
  };
}

/** ¿El usuario tiene posts en los días del seed que se deberían reemplazar? */
export function hasSeedConflicts(existing: ScheduledPost[]): boolean {
  return existing.some((p) => SEED_DATES.has(p.date));
}
