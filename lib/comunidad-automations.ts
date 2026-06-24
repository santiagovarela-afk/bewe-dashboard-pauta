/**
 * Comunidad · Automatizaciones
 *
 * Reglas configurables que, cuando se detecta un comentario o mensaje que
 * matchea un keyword, sugieren una respuesta automática (plantilla) o
 * mueven el contacto en el CRM a otro stage.
 *
 * V1: solo SUGIERE (no ejecuta sola). Cuando el módulo se integre con
 * webhooks de Meta podemos hacer ejecución automática real con un toggle
 * "Auto-responder".
 */

import type { Intent, Industry } from "./comunidad-tags";
import type { ContactStage } from "./comunidad-crm";

export type AutomationTrigger = "keyword" | "any-comment" | "any-message";
export type AutomationAction =
  | { type: "suggest-template"; templateId: string }
  | { type: "move-stage"; stage: ContactStage }
  | { type: "auto-tag"; tag: string }
  | { type: "notify-only" };

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  /** "include" = matchea si CONTIENE el keyword. "exact" = palabra exacta. "regex" = expresión regular. */
  matchType: "include" | "exact" | "regex";
  keywords: string[];
  /** Aplica a cualquier plataforma o solo una */
  platforms: Array<"ig" | "fb" | "messenger">;
  /** Aplica a comentarios o mensajes o ambos */
  channels: Array<"comment" | "message">;
  action: AutomationAction;
  triggeredCount: number;
  createdAt: string;
}

const AUTOMATIONS_KEY = "bewe_comunidad_automations_v1";

export function loadAutomations(): AutomationRule[] {
  if (typeof window === "undefined") return DEFAULT_AUTOMATIONS;
  try {
    const stored = localStorage.getItem(AUTOMATIONS_KEY);
    if (!stored) {
      localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(DEFAULT_AUTOMATIONS));
      return DEFAULT_AUTOMATIONS;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveAutomations(rules: AutomationRule[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(rules));
}

export function incrementTrigger(ruleId: string) {
  const rules = loadAutomations();
  const r = rules.find((x) => x.id === ruleId);
  if (r) {
    r.triggeredCount += 1;
    saveAutomations(rules);
  }
}

/** Determina si un texto matchea una regla. */
export function ruleMatches(rule: AutomationRule, text: string): boolean {
  if (!rule.enabled) return false;
  if (!text) return false;
  const lower = text.toLowerCase();
  if (rule.matchType === "regex") {
    return rule.keywords.some((kw) => {
      try {
        return new RegExp(kw, "i").test(text);
      } catch {
        return false;
      }
    });
  }
  if (rule.matchType === "exact") {
    const words = lower.split(/\s+/);
    return rule.keywords.some((kw) => words.includes(kw.toLowerCase()));
  }
  return rule.keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/** Aplica todas las reglas activas a un texto y devuelve las que matchean. */
export function findMatchingRules(
  text: string,
  ctx: { platform: "ig" | "fb" | "messenger"; channel: "comment" | "message" },
): AutomationRule[] {
  const rules = loadAutomations();
  return rules.filter(
    (r) =>
      r.enabled &&
      r.platforms.includes(ctx.platform) &&
      r.channels.includes(ctx.channel) &&
      ruleMatches(r, text),
  );
}

// ─── REGLAS DEFAULT ────────────────────────────────────────────────────────

export const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  {
    id: "rule-info",
    name: "Pide info / quiere conocer Bewe",
    enabled: true,
    matchType: "include",
    keywords: ["info", "información", "más info", "cuéntame", "que es bewe", "qué es bewe", "como funciona", "cómo funciona"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "suggest-template", templateId: "info-belleza" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
  {
    id: "rule-precio",
    name: "Pregunta por precio",
    enabled: true,
    matchType: "include",
    keywords: ["precio", "precios", "cuanto cuesta", "cuánto cuesta", "cuanto vale", "cuánto vale", "costo", "tarifa"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "suggest-template", templateId: "precios-belleza" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
  {
    id: "rule-demo",
    name: "Pide demo / agendar",
    enabled: true,
    matchType: "include",
    keywords: ["demo", "demostracion", "demostración", "agendar", "agenda", "reunion", "reunión", "llamada"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "suggest-template", templateId: "demo-general" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
  {
    id: "rule-trial",
    name: "Quiere probar / trial",
    enabled: true,
    matchType: "include",
    keywords: ["prueba", "probar", "trial", "gratis", "14 dias", "14 días"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "suggest-template", templateId: "trial-general" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
  {
    id: "rule-interesado",
    name: "Marca de interés alto → mover a Prospecto",
    enabled: true,
    matchType: "include",
    keywords: ["me interesa", "quiero", "necesito", "lo necesito", "como compro", "cómo compro"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "move-stage", stage: "positivo" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
  {
    id: "rule-spam",
    name: "Auto-marcar spam",
    enabled: true,
    matchType: "include",
    keywords: ["follow me", "sígueme", "gana dinero", "wsp +", "whatsapp +", "click aqui", "click here"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "move-stage", stage: "descartado" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
  {
    id: "rule-cerrado",
    name: "Confirmación de compra / conversión",
    enabled: true,
    matchType: "include",
    keywords: ["ya compre", "ya compré", "ya me registre", "ya me registré", "ya estoy", "ya tengo bewe", "ya pague", "ya pagué"],
    platforms: ["ig", "fb", "messenger"],
    channels: ["comment", "message"],
    action: { type: "move-stage", stage: "convertido" },
    triggeredCount: 0,
    createdAt: "2026-06-23T00:00:00",
  },
];
