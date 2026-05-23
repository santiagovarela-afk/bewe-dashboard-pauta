/**
 * Plantillas de captions para la Parrilla.
 * Precargan texto en el Composer para acelerar la programación.
 */
export interface ParrillaTemplate {
  id: string;
  label: string;
  emoji: string;
  caption: string;
  platforms: ("ig" | "fb")[];
  description: string;
}

export const PARRILLA_TEMPLATES: ParrillaTemplate[] = [
  {
    id: "promo-semana",
    label: "Promo semana",
    emoji: "🔥",
    description: "Anuncio de promoción semanal con CTA fuerte",
    platforms: ["ig", "fb"],
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
    caption: `💡 TIP RÁPIDO

¿Sabías que [dato sorprendente / estadística]?

Por eso te recomendamos [acción concreta].

Guarda este post para no olvidarlo 📌

#Tips #Bewe`,
  },
];
