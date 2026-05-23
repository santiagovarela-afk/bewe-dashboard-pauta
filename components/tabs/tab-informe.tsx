"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Copy, Check, Sparkles, Download, MessageSquareText, Hash } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { fmt, daysUntil } from "@/lib/utils";
import { computeMetrics } from "@/lib/selectors";
import { buildSlackShort } from "@/lib/diary";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TabInforme() {
  const { campaigns, daysElapsed, snapshot } = useDashboard();
  const m = computeMetrics(campaigns);
  const dToD7 = daysUntil(PLAN.day7ISO);

  const [generated, setGenerated] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [slackCopied, setSlackCopied] = React.useState(false);

  const slackText = React.useMemo(
    () => buildSlackShort(campaigns, daysElapsed, PLAN.totalDays),
    [campaigns, daysElapsed],
  );

  React.useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, daysElapsed]);

  function generate() {
    setGenerating(true);
    let r = "";
    r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    r += `INFORME DE PAUTA — BEWE MAYO 2026\n`;
    r += `Snapshot: ${snapshot.label} · Día ${daysElapsed}/${PLAN.totalDays}\n`;
    r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    r += `RESUMEN EJECUTIVO\n─────────────────\n`;
    r += `Gasto acumulado: ${fmt.eur(m.spend)} / €${PLAN.budget} (${Math.round(m.budgetPct)}%)\n`;
    r += `Registros (CompleteRegistration): ${m.totalConvCR}\n`;
    r += `Inicios de pago (InitCheckout · excl C3): ${m.totalConvIC}\n`;
    r += `CPT Registro (C1/C2/C4): ${m.cptReg ? fmt.eur(m.cptReg) : "—"} → ${
      m.cptReg
        ? m.cptReg <= PLAN.cpt.target
          ? "✓ EN OBJETIVO"
          : m.cptReg <= PLAN.cpt.warn
            ? "⚠ POR ENCIMA"
            : "✗ CRÍTICO"
        : "—"
    }\n`;
    r += `CPT Inicio pago (C5/C6): ${m.cptIco ? fmt.eur(m.cptIco) : "—"} → ${
      m.cptIco
        ? m.cptIco <= PLAN.cpt.target
          ? "✓ EN OBJETIVO"
          : m.cptIco <= PLAN.cpt.warn
            ? "⚠ POR ENCIMA"
            : "✗ CRÍTICO"
        : "—"
    }\n`;
    r += `Próxima revisión: Día 7 (19 mayo, ${dToD7 > 0 ? "en " + dToD7 + " días" : dToD7 === 0 ? "HOY" : "pasado"})\n\n`;

    r += `ESTADO POR CAMPAÑA\n───────────────────\n`;
    campaigns.forEach((c) => {
      const s =
        c.flag === "critical"
          ? "🚨 CRÍTICO"
          : c.flag === "anomaly"
            ? "⚠ VERIFICAR"
            : c.flag === "warn"
              ? "⚠ ATENCIÓN"
              : "✓ OK";
      r += `${c.code} ${c.name} (${c.status})\n  Gasto: ${fmt.eur(c.spend)} | CompleteReg: ${c.evCompleteReg} | InitCheckout: ${c.evInitCheckout} | CPT: ${c.cpt ? fmt.eur(c.cpt) : "—"} | CTR: ${c.ctr.toFixed(2)}% | ${s}\n`;
      if (c.flag === "critical") r += `  → Plan B / pausar adset con peor CPT\n`;
      if (c.flag === "anomaly") r += `  → Verificar pixel en Eventos Manager\n`;
      r += "\n";
    });

    r += `PENDIENTES URGENTES\n────────────────────\n`;
    r += `✗ PLAN B C2: switch a InitiateCheckout (${campaigns.find((c) => c.code === "C2")?.evCompleteReg ?? 0} CR)\n`;
    r += `✗ C1 CPT €${campaigns.find((c) => c.code === "C1")?.cpt?.toFixed(2)} cruzó umbral crítico — revisar A1.3_INT_BELLEZA\n`;
    r += `□ C3 anomalía CAPI confirmada — excluir de CPT global, no pausar\n`;
    r += `□ Watchpoint geo-leakage Colombia en C4/C5/C6 (≥40% → bid cap)\n`;
    r += `□ 26 mayo (Día 14): Activar C7 si ≥1000 visits + ≥30 trials\n`;
    r += `□ Crear C8 LATAM_TOOLS\n`;
    r += `□ Confirmar UTMs en CRM\n\n`;

    r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    r += `Generado por Bewe Pauta OS · ${new Date().toLocaleString("es")}\n`;
    setGenerated(r);
    setTimeout(() => setGenerating(false), 400);
  }

  function copy() {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success("Informe copiado al portapapeles");
    setTimeout(() => setCopied(false), 2200);
  }

  function download() {
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bewe-informe-pauta-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copySlack() {
    navigator.clipboard.writeText(slackText);
    setSlackCopied(true);
    toast.success("Mensaje Slack copiado · 3 líneas listas para pegar");
    setTimeout(() => setSlackCopied(false), 2200);
  }

  return (
    <div className="max-w-[920px] mx-auto space-y-5">
      <SectionHeader
        title="Informe de estado · mayo 2026"
        sub="Resumen ejecutivo + estado por campaña + pendientes"
        right={
          <>
            <Button onClick={generate} size="sm" variant="glow">
              <Sparkles className="size-3.5" />
              {generating ? "Generando…" : "Regenerar"}
            </Button>
            <Button onClick={copy} size="sm" variant="outline">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button onClick={download} size="sm" variant="outline">
              <Download className="size-3.5" />
              .txt
            </Button>
          </>
        }
      />

      {/* Mensaje corto para Slack (3 líneas) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <TextureCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-[hsl(var(--brand-cyan))]" />
              <h3 className="text-[12px] font-bold">Mensaje corto para Slack</h3>
              <Badge variant="cyan">3 líneas</Badge>
            </div>
            <Button onClick={copySlack} size="sm" variant="outline">
              {slackCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {slackCopied ? "Copiado" : "Copiar Slack"}
            </Button>
          </div>
          <div className="p-4">
            <pre className="font-mono text-[12px] whitespace-pre-wrap leading-relaxed text-foreground/90 bg-background/60 rounded-lg border border-border/60 p-3">
              {slackText}
            </pre>
            <div className="mt-2 text-[10px] text-muted-foreground/70 flex items-center gap-1.5">
              <MessageSquareText className="size-3" />
              Pegar tal cual en #bewe-pauta o WhatsApp · se actualiza con los datos en vivo.
            </div>
          </div>
        </TextureCard>
      </motion.div>

      <motion.div
        key={generated.length}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <TextureCard className="p-6 max-h-[640px] overflow-y-auto">
          <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90">
            {generated}
          </pre>
        </TextureCard>
      </motion.div>
    </div>
  );
}
