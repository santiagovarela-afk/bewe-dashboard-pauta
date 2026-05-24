/**
 * Plantillas de captions para la Parrilla.
 * Precargan texto en el Composer para acelerar la programación.
 *
 * Ampliado en Phase Metricool (mayo 2026):
 *   - +reglas2026: cada plantilla incluye `tip` con la regla de engagement
 *     orgánico aplicable (Reels > foto, carrusel 1.5×, etc.).
 */
export interface ParrillaTemplate {
  id: string;
  label: string;
  emoji: string;
  caption: string;
  platforms: ("ig" | "fb")[];
  description: string;
  /** Regla 2026 que justifica el formato/copy de la plantilla. */
  tip?: string;
}

export const PARRILLA_TEMPLATES: ParrillaTemplate[] = [
  {
    id: "promo-semana",
    label: "Promo semana",
    emoji: "🔥",
    description: "Anuncio de promoción semanal con CTA fuerte",
    platforms: ["ig", "fb"],
    tip: "Hook con cifra fuerte en las primeras 7 palabras · IG corta el caption al 'Ver más'.",
    caption: `🔥 PROMO DE LA SEMANA 🔥

[Producto / servicio] con [X%] de descuento solo hasta el [fecha].

✨ Beneficio 1
✨ Beneficio 2
✨ Beneficio 3

👉 Reserva en bewe.io o escríbenos por DM.

#Bewe #Belleza #Promo`,
  },
  {
    id: "tutorial-linda",
    label: "Tutorial Linda",
    emoji: "💄",
    description: "Tutorial paso a paso al estilo Linda",
    platforms: ["ig"],
    tip: "Convierte a Reel: video corto vertical = +alcance vs foto estática (Meta priorizó Reels).",
    caption: `💄 TUTORIAL EXPRESS

Hoy te enseñamos cómo [acción] en 3 pasos:

1️⃣ Paso uno: [descripción corta]
2️⃣ Paso dos: [descripción corta]
3️⃣ Paso tres: [descripción corta]

¿Te animas a probarlo? Cuéntanos en comentarios 👇

#Tutorial #Bewe #Belleza`,
  },
  {
    id: "caso-exito",
    label: "Caso de éxito",
    emoji: "🏆",
    description: "Testimonio o caso de éxito de cliente",
    platforms: ["ig", "fb"],
    tip: "Formato carrusel · 1.5× más engagement que single image. Slide 1 = nombre + métrica clave.",
    caption: `🏆 HISTORIA DE ÉXITO

Conoce a [Nombre], dueña de [Negocio], que con Bewe logró:

📈 [Métrica 1, ej: +40% reservas]
⏱️ [Métrica 2, ej: ahorrar 5h/semana]
💼 [Métrica 3, ej: gestionar 3 sucursales]

"[Cita textual del cliente]"

👉 ¿Tu próximo paso? Agenda demo gratis: bewe.io

#CasoDeExito #Bewe`,
  },
  {
    id: "tip-rapido",
    label: "Tip rápido",
    emoji: "💡",
    description: "Consejo corto y compartible",
    platforms: ["ig", "fb"],
    tip: "Posts 'guardables' suben alcance · pide explícitamente 'guarda este post'.",
    caption: `💡 TIP RÁPIDO

¿Sabías que [dato sorprendente / estadística]?

Por eso te recomendamos [acción concreta].

Guarda este post para no olvidarlo 📌

#Tips #Bewe`,
  },
  {
    id: "reel-hook",
    label: "Reel hook",
    emoji: "🎬",
    description: "Script para Reel con hook fuerte + payoff",
    platforms: ["ig"],
    tip: "Reels < 15s tienen mayor completion rate · cuelga el hook en frame 1.",
    caption: `🎬 [HOOK frame 1 · ej: "Esto cambia tu salón de belleza para siempre"]

[Payoff en 3 beats:
· Beat 1 → problema concreto
· Beat 2 → solución con Bewe
· Beat 3 → resultado medible]

¿Lo probarías? Cuéntanos 👇

#Reels #Bewe #Negocios`,
  },
  {
    id: "carrusel-edu",
    label: "Carrusel educativo",
    emoji: "📚",
    description: "Slides educativos con un punto por slide",
    platforms: ["ig", "fb"],
    tip: "Carruseles tienen 2× tiempo de visualización · slide final con CTA.",
    caption: `📚 [Título tipo "5 errores que matan tu agenda"]

Desliza →

1. Error / punto uno
2. Error / punto dos
3. Error / punto tres
4. Error / punto cuatro
5. Cómo arreglarlo con Bewe

Sigue a @bewe_software para más 💜

#Carrusel #Bewe`,
  },
  {
    id: "ugc-testimonial",
    label: "UGC testimonial",
    emoji: "🎤",
    description: "Re-postear video/foto de cliente real",
    platforms: ["ig", "fb"],
    tip: "UGC convierte 2-3× mejor que branded · pide permiso y dale crédito.",
    caption: `🎤 NUESTROS CLIENTES LO DICEN

"[Cita textual de cliente real]"

— @[handle del cliente], [tipo de negocio]

Gracias por confiar en Bewe 💜
¿Querés ser el próximo? bewe.io

#Testimonios #Bewe`,
  },
  {
    id: "behind-scenes",
    label: "Behind the scenes",
    emoji: "🎥",
    description: "Detrás de cámaras del equipo / producto",
    platforms: ["ig"],
    tip: "Stories diarios sostienen alcance del feed · BTS es contenido low-cost que conecta.",
    caption: `🎥 BEHIND THE SCENES

Así trabaja el equipo de Bewe en [evento / producto / oficina]:

[1-2 líneas de contexto del momento]

Seguinos para más detrás de cámaras 👀

#Bewe #Equipo`,
  },
];
