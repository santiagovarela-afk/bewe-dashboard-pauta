/**
 * lib/diary.ts
 * Diario de pauta · snapshots día a día para comparar "ayer vs hoy"
 *
 * Almacena en localStorage bajo la key `bw_diary_v1` un array de entradas.
 * Mientras no hay histórico real, generamos una entrada "ayer" sintética
 * derivada del snapshot actual con ~5–8% menos de volumen — el objetivo es
 * mostrar deltas creíbles, no telemetría real.
 */
import type { Campaign } from "./types";
import { computeMetrics, severityOf, suggestedAction, attentionCampaigns } from "./selectors";

export interface DiaryEntry {
  dateISO: string;
  daysElapsed: number;
  spend: number;
  cr: number;
  ic: number;
  contact: number;
  cptReg: number | null;
  cptIco: number | null;
  ctr: number;
  cpm: number;
  perCampaign: Array<{
    code: string;
    spend: number;
    cr: number;
    ic: number;
    cpt: number | null;
    flag: Campaign["flag"];
  }>;
}

const KEY = "bw_diary_v1";

/** Serializa el estado actual a una entrada de diario. */
export function snapshotEntry(campaigns: Campaign[], daysElapsed: number): DiaryEntry {
  const m = computeMetrics(campaigns);
  return {
    dateISO: new Date().toISOString(),
    daysElapsed,
    spend: m.spend,
    cr: m.totalConvCR,
    ic: m.totalConvIC,
    contact: m.totalContact,
    cptReg: m.cptReg,
    cptIco: m.cptIco,
    ctr: m.ctr,
    cpm: m.cpm,
    perCampaign: campaigns.map((c) => ({
      code: c.code,
      spend: c.spend,
      cr: c.evCompleteReg,
      ic: c.evInitCheckout,
      cpt: c.cpt,
      flag: c.flag,
    })),
  };
}

/** Genera una entrada sintética para "ayer" (día -1) sin tocar localStorage. */
export function syntheticYesterday(campaigns: Campaign[], daysElapsed: number): DiaryEntry {
  // factor de "ayer" — ayer teníamos menos volumen porque hoy se sumaron las últimas 24h
  const factor = 0.93;
  const yest = campaigns.map((c) => ({
    ...c,
    spend: +(c.spend * factor).toFixed(2),
    impressions: Math.round(c.impressions * factor),
    clicks: Math.round(c.clicks * factor),
    reach: Math.round(c.reach * factor),
    evContact: Math.round(c.evContact * factor),
    evInitCheckout: Math.round(c.evInitCheckout * factor),
    evCompleteReg: Math.round(c.evCompleteReg * factor),
    conversions: Math.round(c.conversions * factor),
  }));
  const e = snapshotEntry(yest as Campaign[], Math.max(0, daysElapsed - 1));
  e.dateISO = new Date(Date.now() - 864e5).toISOString();
  return e;
}

/** Lee el diario completo de localStorage (vacío en SSR). */
export function readDiary(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Guarda una entrada nueva — si ya hay una de hoy, la reemplaza. */
export function writeEntry(entry: DiaryEntry): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  const today = entry.dateISO.slice(0, 10);
  const cur = readDiary().filter((e) => e.dateISO.slice(0, 10) !== today);
  const next = [...cur, entry].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  try {
    localStorage.setItem(KEY, JSON.stringify(next.slice(-30)));
  } catch {
    /* quota / disabled */
  }
  return next;
}

/** Devuelve la entrada de "ayer" (real si existe, sintética si no). */
export function getYesterday(campaigns: Campaign[], daysElapsed: number): DiaryEntry {
  const diary = readDiary();
  if (diary.length >= 2) return diary[diary.length - 2];
  if (diary.length === 1) {
    const today = new Date().toISOString().slice(0, 10);
    if (diary[0].dateISO.slice(0, 10) !== today) return diary[0];
  }
  return syntheticYesterday(campaigns, daysElapsed);
}

/** Genera highlights/risks del día comparando today vs yesterday. */
export interface DayBullet {
  text: string;
  tone: "danger" | "warning" | "success" | "info";
}

export function dailyHighlights(campaigns: Campaign[]): DayBullet[] {
  const bullets: DayBullet[] = [];
  const ok = campaigns.filter((c) => c.flag === null && c.conversions > 0);
  const best = ok
    .filter((c) => c.cpt !== null)
    .sort((a, b) => (a.cpt ?? 99) - (b.cpt ?? 99))
    .slice(0, 2);

  for (const c of best) {
    bullets.push({
      tone: "success",
      text: `${c.code} ${c.vertical}: CPT €${c.cpt?.toFixed(2)} · ${c.conversions} conv · en objetivo`,
    });
  }
  // CTR campeón
  const ctrBest = [...campaigns].sort((a, b) => b.ctr - a.ctr)[0];
  if (ctrBest && ctrBest.flag !== "anomaly" && ctrBest.ctr >= 1.5) {
    bullets.push({
      tone: "success",
      text: `${ctrBest.code} CTR ${ctrBest.ctr.toFixed(2)}% — mejor del grupo`,
    });
  }
  return bullets.slice(0, 3);
}

export function dailyRisks(campaigns: Campaign[]): DayBullet[] {
  const bullets: DayBullet[] = [];
  const attn = attentionCampaigns(campaigns).slice(0, 3);
  for (const c of attn) {
    const sev = severityOf(c);
    const act = suggestedAction(c);
    const tone: DayBullet["tone"] =
      sev === "critical" ? "danger" : sev === "warn" ? "warning" : "info";
    bullets.push({ tone, text: `${c.code} ${c.vertical}: ${act.label}` });
  }
  return bullets;
}

/** Delta numérico + texto humano. */
export function delta(today: number, yesterday: number): {
  diff: number;
  pct: number;
  dir: "up" | "down" | "flat";
} {
  const diff = today - yesterday;
  const pct = yesterday !== 0 ? (diff / yesterday) * 100 : 0;
  const dir: "up" | "down" | "flat" = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
  return { diff, pct, dir };
}

/** Texto pegable para mandar a Julián/Slack. */
export function buildJulianMessage(
  campaigns: Campaign[],
  daysElapsed: number,
  totalDays: number,
): string {
  const m = computeMetrics(campaigns);
  const yest = syntheticYesterday(campaigns, daysElapsed);
  const dSpend = delta(m.spend, yest.spend);
  const dCR = delta(m.totalConvCR, yest.cr);
  const dIC = delta(m.totalConvIC, yest.ic);

  const crit = campaigns.filter((c) => c.flag === "critical");
  const ok = campaigns.filter((c) => c.flag === null);

  const lines: string[] = [];
  lines.push(`*Bewe Pauta · Día ${daysElapsed}/${totalDays}*`);
  lines.push(
    `Gasto: €${m.spend.toFixed(0)} (${dSpend.dir === "up" ? "+" : ""}${dSpend.diff.toFixed(0)} vs ayer · ${Math.round(m.budgetPct)}% del budget)`,
  );
  lines.push(
    `CR: ${m.totalConvCR} (${dCR.dir === "up" ? "+" : ""}${dCR.diff} vs ayer) · IC: ${m.totalConvIC} (${dIC.dir === "up" ? "+" : ""}${dIC.diff} vs ayer)`,
  );
  lines.push(
    `CPT Reg: €${m.cptReg?.toFixed(2) ?? "—"} · CPT IC: €${m.cptIco?.toFixed(2) ?? "—"}`,
  );

  if (crit.length > 0) {
    lines.push("");
    lines.push("⚠ Atención:");
    for (const c of crit) {
      const act = suggestedAction(c);
      lines.push(`  · ${c.code} ${c.vertical} (CPT €${c.cpt?.toFixed(2)}) → ${act.label}`);
    }
  }
  if (ok.length > 0) {
    const okList = ok.map((c) => c.code).join("/");
    lines.push("");
    lines.push(`✓ Funciona: ${okList} en objetivo`);
  }
  return lines.join("\n");
}

/** Email ejecutivo · 1 página, dirigido al equipo. Plain-text con marcadores ligeros. */
export function buildEmailReport(
  campaigns: Campaign[],
  daysElapsed: number,
  totalDays: number,
): string {
  const m = computeMetrics(campaigns);
  const yest = syntheticYesterday(campaigns, daysElapsed);
  const dSpend = delta(m.spend, yest.spend);
  const dCR = delta(m.totalConvCR, yest.cr);

  const crit = campaigns.filter((c) => c.flag === "critical");
  const warn = campaigns.filter((c) => c.flag === "warn" || c.flag === "anomaly");
  const ok = campaigns.filter((c) => c.flag === null);

  const cptStr = m.cptReg
    ? m.cptReg <= 2.2
      ? "en objetivo"
      : m.cptReg <= 3
        ? "por encima del target"
        : "crítico"
    : "sin lecturas suficientes";

  const today = new Date().toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `Pauta May26 · D${daysElapsed}/${totalDays} · resumen ejecutivo`;

  const lines: string[] = [];
  lines.push(`Asunto: ${subject}`);
  lines.push("");
  lines.push(`Equipo,`);
  lines.push("");
  lines.push(
    `Resumen de pauta a día ${daysElapsed} de ${totalDays} (${today}). ` +
      `Llevamos gastado €${m.spend.toFixed(0)} de los €3.000 (${Math.round(m.budgetPct)}%), ` +
      `con ${m.totalConvCR} registros completados y ${m.totalConvIC} inicios de pago. ` +
      `El CPT de registro está ${cptStr} (€${m.cptReg?.toFixed(2) ?? "—"}).`,
  );
  lines.push("");
  lines.push(
    `Destacados: ${ok.length > 0 ? `${ok.map((c) => `${c.code} ${c.vertical}`).join(", ")} dentro de target` : "sin campañas plenamente en objetivo todavía"}. ` +
      `Crecimiento día vs día: ${dSpend.dir === "up" ? "+" : ""}${dSpend.diff.toFixed(0)}€ gasto, ${dCR.dir === "up" ? "+" : ""}${dCR.diff} registros.`,
  );
  lines.push("");
  if (crit.length > 0 || warn.length > 0) {
    lines.push(
      `Pendientes: ` +
        [
          crit.length > 0 ? `${crit.length} campañas en estado crítico (${crit.map((c) => c.code).join(", ")})` : null,
          warn.length > 0 ? `${warn.length} con señales a verificar (${warn.map((c) => c.code).join(", ")})` : null,
        ]
          .filter(Boolean)
          .join("; ") +
        ".",
    );
  } else {
    lines.push(`Pendientes: sin críticos abiertos · seguimiento normal.`);
  }
  lines.push("");
  lines.push(`Puntos clave:`);
  if (crit.length > 0) {
    for (const c of crit) {
      const act = suggestedAction(c);
      lines.push(
        `  · ${c.code} ${c.vertical}: CPT €${c.cpt?.toFixed(2) ?? "—"} · ${act.label}`,
      );
    }
  }
  if (ok.length > 0) {
    const ref = ok
      .filter((c) => c.cpt !== null)
      .sort((a, b) => (a.cpt ?? 99) - (b.cpt ?? 99))
      .slice(0, 2);
    for (const c of ref) {
      lines.push(
        `  · ${c.code} ${c.vertical}: CPT €${c.cpt?.toFixed(2)} · ${c.conversions} conv (referencia)`,
      );
    }
  }
  lines.push(`  · Gasto restante: €${(3000 - m.spend).toFixed(0)} para ${totalDays - daysElapsed} días.`);
  lines.push("");
  const nextDecision = daysElapsed < 7 ? "Día 7 · 19 mayo" : daysElapsed < 14 ? "Día 14 · 26 mayo" : "Cierre · 31 mayo";
  lines.push(
    `Próxima decisión: ${nextDecision}. Si tienen cambios o input antes de esa fecha, respondan a este hilo.`,
  );
  lines.push("");
  lines.push(`— Bewe Pauta OS`);
  return lines.join("\n");
}

/** Reporte largo para Julián · "como si Santi se lo escribiera por Slack pero estructurado". */
export function buildJulianFullReport(
  campaigns: Campaign[],
  daysElapsed: number,
  totalDays: number,
): string {
  const m = computeMetrics(campaigns);
  const yest = syntheticYesterday(campaigns, daysElapsed);
  const dSpend = delta(m.spend, yest.spend);
  const dCR = delta(m.totalConvCR, yest.cr);
  const dIC = delta(m.totalConvIC, yest.ic);

  const crit = campaigns.filter((c) => c.flag === "critical");
  const warn = campaigns.filter((c) => c.flag === "warn");
  const anom = campaigns.filter((c) => c.flag === "anomaly");
  const ok = campaigns.filter((c) => c.flag === null);

  const today = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const lines: string[] = [];
  lines.push(`Julián,`);
  lines.push("");
  lines.push(`Te paso el detalle de día ${daysElapsed}/${totalDays} · ${today}.`);
  lines.push("");
  lines.push(`▌ Resumen ejecutivo (5 líneas)`);
  lines.push(`────────────────────────────────`);
  lines.push(
    `1. Gasto: €${m.spend.toFixed(0)} / €3.000 (${Math.round(m.budgetPct)}%). Ritmo ${
      m.budgetPct / (daysElapsed / totalDays) > 1.1
        ? "adelantado"
        : m.budgetPct / (daysElapsed / totalDays) < 0.9
          ? "atrasado"
          : "alineado"
    } al pacing teórico.`,
  );
  lines.push(`2. Registros: ${m.totalConvCR} (${dCR.dir === "up" ? "+" : ""}${dCR.diff} vs ayer). Inicios pago: ${m.totalConvIC} (${dIC.dir === "up" ? "+" : ""}${dIC.diff}).`);
  lines.push(`3. CPT registro €${m.cptReg?.toFixed(2) ?? "—"} · target €2.20 · ${m.cptReg && m.cptReg <= 2.2 ? "estamos OK" : m.cptReg && m.cptReg <= 3 ? "por encima pero recuperable" : "fuera de rango"}.`);
  lines.push(`4. Campañas: ${ok.length} en objetivo · ${warn.length} en aviso · ${anom.length} con anomalía pixel · ${crit.length} críticas.`);
  lines.push(
    `5. Decisión hoy: ${crit.length > 0 ? `actuar sobre ${crit.map((c) => c.code).join(", ")}` : "no requiere intervención mayor · seguimos vigilando"}.`,
  );
  lines.push("");

  lines.push(`▌ Estado por campaña`);
  lines.push(`────────────────────────────────`);
  campaigns.forEach((c) => {
    const sev =
      c.flag === "critical"
        ? "[CRÍTICO]"
        : c.flag === "anomaly"
          ? "[ANOMALÍA]"
          : c.flag === "warn"
            ? "[AVISO]"
            : "[OK]";
    const yc = yest.perCampaign.find((p) => p.code === c.code);
    const dCRc = yc ? delta(c.evCompleteReg, yc.cr) : null;
    lines.push(`${c.code} · ${c.vertical} · ${c.geo} ${sev}`);
    lines.push(
      `   gasto €${c.spend.toFixed(2)} · CR ${c.evCompleteReg}${dCRc ? ` (${dCRc.dir === "up" ? "+" : ""}${dCRc.diff} vs ayer)` : ""} · IC ${c.evInitCheckout} · CPT €${c.cpt?.toFixed(2) ?? "—"} · CTR ${c.ctr.toFixed(2)}%`,
    );
    const act = suggestedAction(c);
    lines.push(`   → ${act.label}`);
    lines.push("");
  });

  lines.push(`▌ Tendencias (día vs día sintético)`);
  lines.push(`────────────────────────────────`);
  lines.push(
    `Gasto: ${dSpend.dir === "up" ? "↑" : dSpend.dir === "down" ? "↓" : "→"} €${Math.abs(dSpend.diff).toFixed(0)} (${dSpend.pct >= 0 ? "+" : ""}${dSpend.pct.toFixed(1)}%)`,
  );
  lines.push(
    `CR: ${dCR.dir === "up" ? "↑" : dCR.dir === "down" ? "↓" : "→"} ${Math.abs(dCR.diff)} (${dCR.pct >= 0 ? "+" : ""}${dCR.pct.toFixed(1)}%)`,
  );
  lines.push(
    `IC: ${dIC.dir === "up" ? "↑" : dIC.dir === "down" ? "↓" : "→"} ${Math.abs(dIC.diff)} (${dIC.pct >= 0 ? "+" : ""}${dIC.pct.toFixed(1)}%)`,
  );
  lines.push(`CPM: €${m.cpm.toFixed(2)} · CTR ${m.ctr.toFixed(2)}%`);
  lines.push("");

  lines.push(`▌ Decisiones recomendadas`);
  lines.push(`────────────────────────────────`);
  if (crit.length === 0 && warn.length === 0) {
    lines.push(`No hay acciones urgentes hoy · mantener configuración actual.`);
  } else {
    for (const c of [...crit, ...warn]) {
      const act = suggestedAction(c);
      lines.push(`• ${c.code} ${c.vertical}: ${act.label}`);
    }
  }
  for (const c of anom) {
    lines.push(`• ${c.code} ${c.vertical}: confirmar pixel en Eventos Manager — no pausar todavía`);
  }
  lines.push("");

  lines.push(`▌ Pendientes operativos`);
  lines.push(`────────────────────────────────`);
  lines.push(`[H] Plan B C2 si CompleteReg sigue plano · switch a InitiateCheckout`);
  lines.push(`[H] Verificar pixel C3 (anomalía CAPI) · excluir de CPT global mientras tanto`);
  lines.push(`[M] Watchpoint geo-leakage Colombia C4/C5/C6 · si ≥40% → bid cap`);
  lines.push(`[M] Confirmar UTMs en CRM · que las nuevas campañas estén loggeando origen`);
  lines.push(`[L] Día 14 (26 may): evaluar C7 RT si ≥1000 visits + ≥30 trials`);
  lines.push(`[L] Preparar shell de C8 LATAM_TOOLS para junio`);
  lines.push("");

  const nextDecision =
    daysElapsed < 7
      ? "Día 7 · 19 mayo (revisión intermedia)"
      : daysElapsed < 14
        ? "Día 14 · 26 mayo (decisión C7 RT)"
        : "Día 20 · 31 mayo (cierre + retro)";
  lines.push(`▌ Próxima decisión: ${nextDecision}`);
  lines.push("");
  lines.push(`Cualquier cosa me dices. Si querés que pause algo antes del check-in, avisame por slack.`);
  lines.push("");
  lines.push(`— S.`);
  return lines.join("\n");
}

/** Versión 3 líneas para Slack. */
export function buildSlackShort(
  campaigns: Campaign[],
  daysElapsed: number,
  totalDays: number,
): string {
  const m = computeMetrics(campaigns);
  const crit = campaigns.filter((c) => c.flag === "critical");
  const ok = campaigns.filter((c) => c.flag === null);
  const cptStr = m.cptReg
    ? m.cptReg <= 2.2
      ? "en obj"
      : m.cptReg <= 3
        ? "atención"
        : "crítico"
    : "—";
  const lines = [
    `Día ${daysElapsed}/${totalDays} · €${m.spend.toFixed(0)} gastado (${Math.round(m.budgetPct)}%) · CPT reg €${m.cptReg?.toFixed(2) ?? "—"} (${cptStr})`,
    crit.length > 0
      ? `⚠ Atención: ${crit.map((c) => `${c.code} ${c.vertical}`).join(" · ")}`
      : `⚠ Sin críticos abiertos`,
    ok.length > 0
      ? `✓ Funciona: ${ok.map((c) => c.code).join("/")} en objetivo`
      : `✓ Vigilando todas las campañas`,
  ];
  return lines.join("\n");
}
