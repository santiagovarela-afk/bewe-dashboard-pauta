"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  Inbox,
  MessageSquare,
  Send,
  Sparkles,
  Tag,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Comunidad · Tour de onboarding (7 pasos)
 *
 * Modal centrado, no usa react-joyride (evitamos dependencia nueva).
 * Se muestra automáticamente la primera vez que un usuario abre la tab
 * Comunidad (guarda flag en localStorage). Re-disparable desde el botón
 * "Ver tour" en el header del tab.
 */

interface Step {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}

export function ComunidadTour({
  onClose,
  userName,
}: {
  onClose: () => void;
  userName: string;
}) {
  const firstName = userName.split(" ")[0] ?? userName;
  const [idx, setIdx] = React.useState(0);

  const steps: Step[] = [
    {
      icon: <MessageCircle className="size-8 text-violet-400" />,
      title: `¡Hola ${firstName}! 👋`,
      body: (
        <>
          <p>
            Bienvenido al módulo <strong>Comunidad</strong>. Acá administras todo lo que la
            audiencia de Bewe nos dice en Instagram y Facebook.
          </p>
          <p className="text-muted-foreground">
            Te muestro en 30 segundos qué hace cada cosa.
          </p>
        </>
      ),
    },
    {
      icon: <Inbox className="size-8 text-blue-400" />,
      title: "Resumen",
      body: (
        <>
          <p>
            La <strong>primera vista</strong> que ves al entrar. Tiene los números
            principales del día:
          </p>
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
            <li>Comentarios nuevos en IG y FB</li>
            <li>Conversaciones de Messenger activas y sin leer</li>
            <li>Actividad reciente y posts con más interacción</li>
          </ul>
          <p>Sirve para tener un pulso rápido antes de meterte a contestar.</p>
        </>
      ),
    },
    {
      icon: <MessageSquare className="size-8 text-emerald-400" />,
      title: "Comentarios",
      body: (
        <>
          <p>
            Acá ves <strong>todos los comentarios</strong> que dejaron en posts y reels de
            Instagram y Facebook, mezclados en una sola lista cronológica.
          </p>
          <p className="text-muted-foreground">
            Filtros por plataforma, etiqueta funnel, búsqueda por palabra. Click en un
            comentario → panel derecho con el detalle + caja para responder.
          </p>
        </>
      ),
    },
    {
      icon: <Send className="size-8 text-pink-400" />,
      title: "Messenger",
      body: (
        <>
          <p>
            Las <strong>conversaciones privadas</strong> que llegan por Messenger de
            Facebook. Las DMs de Instagram las activaremos en una próxima versión.
          </p>
          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-200 text-xs">
            ⏰ <strong>Ventana 24h:</strong> Meta solo deja responder libremente dentro
            de las 24 horas desde el último mensaje del usuario. Después de eso, las
            respuestas requieren etiquetas especiales.
          </div>
        </>
      ),
    },
    {
      icon: <Sparkles className="size-8 text-amber-400" />,
      title: "Plantillas + IA",
      body: (
        <>
          <p>
            En la pestaña <strong>Plantillas</strong> tienes respuestas listas para usar.
            Vienen 8 pre-cargadas (saludo, precios, demo, info producto…) y puedes crear
            todas las que quieras.
          </p>
          <p>
            Cuando vayas a responder, hay un botón{" "}
            <strong className="text-violet-300">✨ Sugerir IA</strong> que analiza el
            mensaje y te recomienda qué plantilla usar — pero{" "}
            <strong>nunca responde sola</strong>, solo recomienda.
          </p>
          <p className="text-muted-foreground">
            Las plantillas soportan variables como{" "}
            <code className="rounded bg-muted/40 px-1">{"{{nombre}}"}</code>.
          </p>
        </>
      ),
    },
    {
      icon: <Tag className="size-8 text-cyan-400" />,
      title: "Etiquetas funnel",
      body: (
        <>
          <p>
            A cada comentario o conversación le puedes poner una etiqueta para saber{" "}
            <strong>en qué punto del funnel</strong> está:
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>🆕 <strong>Nuevo</strong> · sin clasificar</li>
            <li>👋 <strong>Interesado</strong> · mostró interés inicial</li>
            <li>💬 <strong>En conversación</strong> · intercambio activo</li>
            <li>🔥 <strong>Caliente</strong> · a punto de reservar/comprar</li>
            <li>📞 <strong>Pasado a comercial</strong> · escalado al equipo</li>
            <li>✅ <strong>Cliente</strong> · cerró conversión</li>
            <li>🚫 <strong>Descartado</strong> · spam u off-topic</li>
          </ul>
          <p>Te permite ver el flujo de prospectos que vienen por redes.</p>
        </>
      ),
    },
    {
      icon: <Check className="size-8 text-emerald-400" />,
      title: "Estás listo 🚀",
      body: (
        <>
          <p>
            Eso es todo. Tu rol es <strong>responder con criterio</strong>, no en
            automático — Bewe se diferencia por su atención humana y cercana.
          </p>
          <p className="text-muted-foreground">
            Si necesitas repasar este tour, hay un botón{" "}
            <strong>Ver tour</strong> arriba a la derecha del módulo Comunidad.
          </p>
          <p>Cualquier duda, escríbele a Santiago. ¡Éxitos!</p>
        </>
      ),
    },
  ];

  const totalSteps = steps.length;
  const step = steps[idx];
  const isLast = idx === totalSteps - 1;

  const next = () => {
    if (isLast) onClose();
    else setIdx(idx + 1);
  };
  const prev = () => setIdx(Math.max(0, idx - 1));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-xl border border-border/60 bg-card shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>

          {/* Step indicator */}
          <div className="flex gap-1.5 p-4 pb-0">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= idx ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              {step.icon}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Paso {idx + 1} de {totalSteps}
                </p>
                <h2 className="text-lg font-semibold">{step.title}</h2>
              </div>
            </div>
            <div className="space-y-2 text-sm">{step.body}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border/40 p-4">
            <Button onClick={prev} variant="ghost" size="sm" disabled={idx === 0}>
              <ArrowLeft className="size-4" />
              <span className="ml-1.5">Atrás</span>
            </Button>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="ghost" size="sm">
                Saltar
              </Button>
              <Button onClick={next} size="sm" className="gap-1.5">
                {isLast ? "Empezar" : "Siguiente"}
                {!isLast && <ArrowRight className="size-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
