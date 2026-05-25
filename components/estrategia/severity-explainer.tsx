"use client";
import * as React from "react";
import type { Campaign, DailyRow } from "@/lib/types";
import { CPT_THRESHOLDS } from "@/lib/utils";

/**
 * Calcula durabilidad de la severidad en los últimos N días.
 *
 * El user no quiere que una campaña que tuvo UN día malo aparezca como CRÍTICA.
 * Validamos persistencia: cuántos de los últimos N días la campaña estuvo
 * efectivamente sobre umbrales críticos / warn.
 */
export interface SeverityContext {
  /** días consecutivos en estado crítico (cpt > critical) */
  criticalDays: number;
  /** días consecutivos en estado warn (cpt > warn) */
  warnDays: number;
  /** Tamaño de la ventana evaluada. */
  windowDays: number;
  /** Texto humano "Crítico desde hace X días" o "Pico aislado · 1 día malo en últimos 7" */
  label: string;
  /** Severidad real considerando persistencia. Si tuvo solo 1 día malo · downgrade a warn. */
  effective: "critical" | "warn" | "anomaly" | "ok";
  /** Justificación con números concretos. */
  reason: string;
}

/**
 * Lee el daily breakdown filtrado a la campaña y calcula
 * durabilidad de su estado crítico / warn en los últimos `windowDays`.
 */
export function computeSeverityContext(
  c: Campaign,
  daily: DailyRow[],
  windowDays = 7,
): SeverityContext {
  // anomalía pixel (C3) — tratamiento especial, no aplica CPT
  if (c.flag === "anomaly") {
    return {
      criticalDays: 0,
      warnDays: 0,
      windowDays,
      label: "Anomalía pixel · excluida del CPT",
      effective: "anomaly",
      reason: "C3 dispara IC en page load · no comparable",
    };
  }

  // filtramos rows campaign-level (sin adsetId) ordenadas desc por fecha
  const rows = daily
    .filter((r) => r.campaignId === c.cid && !r.adsetId)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, windowDays);

  if (rows.length === 0) {
    // Sin daily breakdown · usar flag de agregado tal cual
    return {
      criticalDays: c.flag === "critical" ? 1 : 0,
      warnDays: c.flag === "warn" ? 1 : 0,
      windowDays,
      label: "Sin histórico diario disponible",
      effective:
        c.flag === "critical" ? "critical" : c.flag === "warn" ? "warn" : "ok",
      reason: "Status calculado sobre el agregado del rango activo.",
    };
  }

  // Por cada día calculamos su CPT (spend del día / evento del día)
  let crit = 0;
  let warn = 0;
  let zeroConvDays = 0;
  let spendSum = 0;
  let convSum = 0;
  for (const r of rows) {
    const ev = c.event === "CompleteRegistration" ? r.evCompleteReg : r.evInitCheckout;
    spendSum += r.spend;
    convSum += ev;
    if (r.spend > 0 && ev === 0) zeroConvDays++;
    if (ev > 0 && r.spend > 0) {
      const cpt = r.spend / ev;
      if (cpt > CPT_THRESHOLDS.critical) crit++;
      else if (cpt > CPT_THRESHOLDS.warn) warn++;
    } else if (r.spend > 0 && ev === 0) {
      // gasto con cero conversiones también suma como crítico
      crit++;
    }
  }

  const n = rows.length;
  // Persistencia: si más de la mitad de la ventana está crítico → crítico real.
  let effective: SeverityContext["effective"] = "ok";
  if (crit >= Math.ceil(n / 2)) effective = "critical";
  else if (crit + warn >= Math.ceil(n / 2)) effective = "warn";
  else if (crit > 0) effective = "warn"; // pico aislado · downgrade

  const cptAvg = convSum > 0 ? spendSum / convSum : null;

  let label: string;
  if (effective === "critical") {
    label = `Crítico ${crit} de últimos ${n} días`;
  } else if (effective === "warn" && crit > 0) {
    label = `Pico aislado · ${crit} día${crit !== 1 ? "s" : ""} crítico en últimos ${n}`;
  } else if (effective === "warn") {
    label = `Atención ${warn} de últimos ${n} días`;
  } else {
    label = `Estable últimos ${n} días`;
  }

  const reasons: string[] = [];
  if (cptAvg !== null)
    reasons.push(`CPT medio €${cptAvg.toFixed(2)} en ${n} días`);
  if (zeroConvDays > 0) reasons.push(`${zeroConvDays} día${zeroConvDays !== 1 ? "s" : ""} con gasto y 0 conv`);
  if (c.freq > 1.9) reasons.push(`freq ${c.freq.toFixed(2)}× cerca de techo`);

  return {
    criticalDays: crit,
    warnDays: warn,
    windowDays: n,
    label,
    effective,
    reason: reasons.length > 0 ? reasons.join(" · ") : "Sin observaciones particulares.",
  };
}
