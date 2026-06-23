"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Palette,
  Layout,
  Sparkles,
  Library,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Download,
  Loader2,
  Wand2,
  History as HistoryIcon,
  Type as TypeIcon,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  Mic,
  Code,
  Hash,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextureCard } from "@/components/fx/texture-card";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BRAND_COLORS,
  BRAND_GRADIENTS,
  BRAND_FONTS,
  BRAND_RULES,
  CONTENT_FORMATS,
  BRAND_VOICE,
  TYPICAL_CTAS,
  UTM_STRUCTURE,
  AUDIO_SPECS,
  buildBrandGuardrailsPrompt,
} from "@/lib/bewe-studio-brand";
import {
  loadHistory,
  pushHistory,
  type HistoryEntry,
} from "@/components/open-bui/history";

type SubTab = "brand" | "templates" | "generator" | "library" | "studio-cli" | "canva" | "history";

export function TabOpenBui() {
  const [sub, setSub] = React.useState<SubTab>("brand");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Bewe Studio"
        sub="Sistema de producción de contenido · brand kit + templates + IA + CLI local"
        accent="cyan"
        right={
          <Badge variant="outline" className="text-[10px] gap-1.5">
            <ShieldCheck className="size-3 text-emerald-400" /> Brand kit oficial
          </Badge>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-2">
        {(
          [
            { id: "brand", label: "Brand Kit", icon: Palette, color: "text-cyan-400" },
            { id: "templates", label: "Templates", icon: Layout, color: "text-blue-400" },
            { id: "generator", label: "Generador IA", icon: Sparkles, color: "text-violet-400" },
            { id: "library", label: "Biblioteca", icon: Library, color: "text-amber-400" },
            { id: "studio-cli", label: "Bewe Studio (Local)", icon: Terminal, color: "text-emerald-400" },
            { id: "canva", label: "Canva", icon: ImageIcon, color: "text-pink-400" },
            { id: "history", label: "Histórico", icon: HistoryIcon, color: "text-muted-foreground" },
          ] as const
        ).map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              sub === id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <Icon className={cn("size-3.5", sub === id ? "" : color)} />
            {label}
          </button>
        ))}
      </div>

      <motion.div
        key={sub}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {sub === "brand" && <BrandKitView />}
        {sub === "templates" && <TemplatesView />}
        {sub === "generator" && <GeneratorView />}
        {sub === "library" && <LibraryView />}
        {sub === "studio-cli" && <StudioCLIView />}
        {sub === "canva" && <CanvaView />}
        {sub === "history" && <HistoryView />}
      </motion.div>
    </div>
  );
}

// ─── BRAND KIT VIEW ────────────────────────────────────────────────────────

function BrandKitView() {
  const [copiedHex, setCopiedHex] = React.useState<string | null>(null);

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
    toast.success(`${hex} copiado`);
  };

  return (
    <div className="space-y-6">
      <TextureCard className="p-5 bg-gradient-to-br from-[#0A2540]/40 to-[#102E4E]/20 border-cyan-500/20">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-cyan-500/20">
            <Palette className="size-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Brand Kit · Foundations v2.0</h3>
            <p className="mt-1 text-sm text-muted-foreground italic">"{BRAND_VOICE.tone}"</p>
            <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {BRAND_VOICE.rules.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-400" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TextureCard>

      <div>
        <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <span className="text-base">🎨</span> Paleta oficial · {BRAND_COLORS.length} colores
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {BRAND_COLORS.map((c) => (
            <motion.button
              key={c.hex}
              whileHover={{ y: -2 }}
              onClick={() => copyHex(c.hex)}
              className="group relative overflow-hidden rounded-lg border border-border/40 bg-card/40 p-3 text-left transition-shadow hover:shadow-lg"
            >
              <div className="h-16 rounded-md mb-2 shadow-inner" style={{ backgroundColor: c.hex }} />
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold">{c.name}</span>
                {copiedHex === c.hex ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                )}
              </div>
              <code className="text-[10px] font-mono text-cyan-400">{c.hex}</code>
              <p className="mt-1 text-[10px] text-muted-foreground">{c.role}</p>
              {c.notes && <p className="mt-1 text-[10px] text-amber-400">{c.notes}</p>}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <Layers className="size-4" /> Gradientes de marca · {BRAND_GRADIENTS.length}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {BRAND_GRADIENTS.map((g) => (
            <motion.button
              key={g.name}
              whileHover={{ y: -2 }}
              onClick={() => {
                navigator.clipboard?.writeText(g.css);
                toast.success(`Gradiente ${g.name} copiado`);
              }}
              className="overflow-hidden rounded-lg border border-border/40 bg-card/40 text-left"
            >
              <div className="h-24" style={{ background: g.css }} />
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{g.name}</span>
                  <Badge variant="outline" className="text-[9px]">{g.angle}°</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{g.use}</p>
                <code className="block text-[9px] font-mono text-cyan-400 truncate">{g.css}</code>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <TypeIcon className="size-4" /> Tipografía
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          {BRAND_FONTS.map((f) => (
            <TextureCard key={f.family} className="p-4">
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-2xl font-semibold"
                  style={{ fontFamily: f.family, letterSpacing: f.letterSpacing }}
                >
                  {f.family}
                </span>
                <span className="text-[10px] text-muted-foreground">{f.weights.join(" · ")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{f.use}</p>
              {f.notes && <p className="mt-1 text-[10px] text-amber-400 leading-relaxed">{f.notes}</p>}
            </TextureCard>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextureCard className="p-4 border-emerald-500/20 bg-emerald-500/[0.03]">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2 text-emerald-300">
            <Check className="size-4" /> Reglas SÍ ({BRAND_RULES.filter((r) => r.type === "do").length})
          </h4>
          <ul className="space-y-2">
            {BRAND_RULES.filter((r) => r.type === "do").map((r, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span className="text-foreground/90">{r.text}</span>
              </li>
            ))}
          </ul>
        </TextureCard>

        <TextureCard className="p-4 border-rose-500/20 bg-rose-500/[0.03]">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2 text-rose-300">
            <AlertTriangle className="size-4" /> Reglas NO ({BRAND_RULES.filter((r) => r.type === "dont").length})
          </h4>
          <ul className="space-y-2">
            {BRAND_RULES.filter((r) => r.type === "dont").map((r, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-rose-400 shrink-0">✕</span>
                <span className="text-foreground/90">{r.text.replace(/^❌\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </TextureCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextureCard className="p-4">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Wand2 className="size-4" /> CTAs típicos
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {TYPICAL_CTAS.map((cta) => (
              <button
                key={cta}
                onClick={() => {
                  navigator.clipboard?.writeText(cta);
                  toast.success("CTA copiado");
                }}
                className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-[11px] text-cyan-200 hover:bg-cyan-500/20 transition"
              >
                {cta}
              </button>
            ))}
          </div>
        </TextureCard>

        <TextureCard className="p-4">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Hash className="size-4" /> Estructura UTM
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div><span className="text-muted-foreground">utm_source:</span> {UTM_STRUCTURE.source.join(" | ")}</div>
            <div><span className="text-muted-foreground">utm_medium:</span> {UTM_STRUCTURE.medium.join(" | ")}</div>
            <div><span className="text-muted-foreground">utm_campaign:</span> {UTM_STRUCTURE.campaign}</div>
            <div><span className="text-muted-foreground">utm_content:</span> {UTM_STRUCTURE.content}</div>
          </div>
        </TextureCard>
      </div>

      <TextureCard className="p-4">
        <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <Mic className="size-4" /> Audio · specs de masterización
        </h4>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Niveles</p>
            <p>🎤 Voz: <code>{AUDIO_SPECS.voice}</code></p>
            <p>🎵 Música: <code>{AUDIO_SPECS.music}</code></p>
            <p>🔊 SFX: <code>{AUDIO_SPECS.sfx}</code></p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Máster final</p>
            <p className="font-mono text-emerald-300">{AUDIO_SPECS.master}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{AUDIO_SPECS.musicStyle}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Cadena FFmpeg</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(AUDIO_SPECS.ffmpegChain);
                toast.success("Cadena copiada");
              }}
              className="text-[10px] font-mono text-cyan-300 hover:text-cyan-200 text-left"
            >
              <code className="line-clamp-3 break-all">{AUDIO_SPECS.ffmpegChain}</code>
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                <Copy className="size-2.5" /> Click para copiar
              </span>
            </button>
          </div>
        </div>
      </TextureCard>
    </div>
  );
}

// ─── TEMPLATES VIEW ────────────────────────────────────────────────────────

function TemplatesView() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {CONTENT_FORMATS.length} formatos oficiales · specs reales del repo bewe-studio
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_FORMATS.map((f) => (
          <motion.div key={f.id} whileHover={{ y: -2 }}>
            <TextureCard className="p-4 h-full space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-2xl shrink-0">
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold leading-tight">{f.name}</h4>
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{f.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/40 pt-2">
                <div>
                  <p className="text-muted-foreground">Aspect</p>
                  <code className="font-mono text-cyan-300">{f.aspectRatio}</code>
                </div>
                <div>
                  <p className="text-muted-foreground">Dimensiones</p>
                  <code className="font-mono text-cyan-300">{f.dimensions}</code>
                </div>
                {f.duration && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Duración</p>
                    <code className="font-mono text-cyan-300">{f.duration}</code>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {f.canvaTemplate && (
                  <a
                    href={f.canvaTemplate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-pink-500/15 border border-pink-500/30 px-2.5 py-1.5 text-[10px] font-medium text-pink-200 hover:bg-pink-500/25 transition"
                  >
                    <ImageIcon className="size-3" /> Abrir en Canva <ExternalLink className="size-2.5" />
                  </a>
                )}
                {f.beweStudioCommand && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(f.beweStudioCommand!);
                      toast.success("Comando copiado");
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-[10px] font-medium text-emerald-200 hover:bg-emerald-500/25 transition"
                  >
                    <Terminal className="size-3" /> <code>{f.beweStudioCommand}</code>
                  </button>
                )}
              </div>
            </TextureCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── GENERATOR VIEW ────────────────────────────────────────────────────────

function GeneratorView() {
  const [brief, setBrief] = React.useState("");
  const [format, setFormat] = React.useState<string>("carousel");
  const [mode, setMode] = React.useState<"image" | "html">("image");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ dataUri?: string; html?: string; mimeType?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const formatDef = CONTENT_FORMATS.find((f) => f.id === format);

  const generate = async () => {
    if (!brief.trim()) {
      toast.error("Escribe un brief primero");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const systemPrompt = buildBrandGuardrailsPrompt();
      const fullPrompt = `${systemPrompt}\n\nFORMATO: ${formatDef?.name} (${formatDef?.aspectRatio}, ${formatDef?.dimensions})\nBRIEF: ${brief}`;

      if (mode === "image") {
        const r = await fetch("/api/nano-banana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt }),
        });
        const d = await r.json();
        if (d.dataUri) {
          setResult({ dataUri: d.dataUri, mimeType: d.mimeType });
          pushHistory({
            id: Date.now().toString(),
            timestamp: Date.now(),
            skillId: format,
            brief,
            html: "",
            previewDataUri: d.dataUri,
          });
        } else {
          setError(d.error ?? "Sin imagen generada");
        }
      } else {
        const r = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: `Genera HTML/CSS para este brief en formato ${formatDef?.aspectRatio} (${formatDef?.dimensions}). Brief: ${brief}`,
            system: systemPrompt,
            maxTokens: 4096,
          }),
        });
        const d = await r.json();
        if (d.text) {
          setResult({ html: d.text });
          pushHistory({
            id: Date.now().toString(),
            timestamp: Date.now(),
            skillId: format,
            brief,
            html: d.text,
          });
        } else {
          setError(d.error ?? "Sin contenido generado");
        }
      }
      toast.success("Generado · guardado en histórico");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr] min-h-[600px]">
      <div className="space-y-3">
        <TextureCard className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-400" />
            <h4 className="text-sm font-semibold">Generador IA</h4>
            <Badge variant="outline" className="ml-auto text-[9px] gap-1">
              <ShieldCheck className="size-2.5 text-emerald-400" /> Brand-safe
            </Badge>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Formato</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_FORMATS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.icon} {f.name} · {f.dimensions}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Tipo de salida</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMode("image")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-2 text-xs transition",
                  mode === "image" ? "border-violet-500/40 bg-violet-500/10 text-violet-200" : "border-border/40 text-muted-foreground hover:bg-muted/40",
                )}
              >
                <ImageIcon className="size-3" /> Imagen (Nano Banana)
              </button>
              <button
                onClick={() => setMode("html")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-2 text-xs transition",
                  mode === "html" ? "border-violet-500/40 bg-violet-500/10 text-violet-200" : "border-border/40 text-muted-foreground hover:bg-muted/40",
                )}
              >
                <Code className="size-3" /> HTML (Gemini)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Brief</label>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Ej: Carrusel para PYMEs de belleza, mostrando que Bewe ahorra 3 horas al día con CRM + agenda + WhatsApp automatizado. Frase central: 'Deja de operar. Empieza a dirigir.' Estilo editorial con gradiente Linda."
              rows={6}
              className="text-xs"
            />
          </div>

          <Button
            onClick={generate}
            disabled={loading || !brief.trim()}
            className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-cyan-500"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Generar {mode === "image" ? "imagen" : "HTML"}
          </Button>

          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] p-2 text-[10px] space-y-1">
            <p className="text-emerald-300 font-medium flex items-center gap-1">
              <ShieldCheck className="size-3" /> Brand kit pre-cargado
            </p>
            <p className="text-emerald-200/70">
              El prompt incluye la paleta, tipografía, gradientes y reglas no-negociables. La IA NO puede
              usar #000, #FFF, morado, emojis, etc.
            </p>
          </div>
        </TextureCard>
      </div>

      <TextureCard className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="size-4" /> Preview
          </h4>
          {result && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (result.dataUri) {
                  const a = document.createElement("a");
                  a.href = result.dataUri;
                  a.download = `bewe-${format}-${Date.now()}.${result.mimeType?.split("/")[1] ?? "png"}`;
                  a.click();
                } else if (result.html) {
                  navigator.clipboard?.writeText(result.html);
                  toast.success("HTML copiado");
                }
              }}
              className="gap-1.5 text-[10px] h-7"
            >
              <Download className="size-3" /> Descargar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="size-8 animate-spin text-violet-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Generando con brand kit aplicado...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <AlertTriangle className="size-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-rose-300">Error</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        ) : result?.dataUri ? (
          <div className="flex-1 flex items-center justify-center bg-muted/10 rounded-md overflow-hidden">
            <img src={result.dataUri} alt="Resultado" className="max-w-full max-h-[520px] object-contain" />
          </div>
        ) : result?.html ? (
          <iframe srcDoc={result.html} title="Preview HTML" className="flex-1 w-full rounded-md bg-white" />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="max-w-sm">
              <Sparkles className="size-12 mx-auto mb-3 opacity-30 text-violet-400" />
              <p className="text-sm font-medium">Listo para generar</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Describe lo que quieres y la IA lo crea con el brand kit de Bewe aplicado automáticamente.
              </p>
            </div>
          </div>
        )}
      </TextureCard>
    </div>
  );
}

// ─── LIBRARY VIEW ──────────────────────────────────────────────────────────

const LIBRARY_RESOURCES = [
  { title: "Repo bewe-studio (skill)", category: "referencias" as const, description: "Repositorio completo · brand kit + templates Remotion + references", url: "https://github.com/santiagovarela-afk/bewe-studio", icon: "📚" },
  { title: "Inter (Google Fonts)", category: "fonts" as const, description: "Tipografía principal · pesos 400/600/700/800", url: "https://fonts.google.com/specimen/Inter", icon: "🔤" },
  { title: "Merriweather Italic", category: "fonts" as const, description: "SOLO para Linda y keywords aislados", url: "https://fonts.google.com/specimen/Merriweather", icon: "🔤" },
  { title: "Higgsfield Soul (Avatares)", category: "referencias" as const, description: "Generador de avatares AI para personajes recurrentes", url: "https://higgsfield.ai", icon: "👤" },
  { title: "Deep house cálido (mood)", category: "musica" as const, description: "Estilo musical recomendado · busca playlists en Spotify", icon: "🎵" },
  { title: "Lo-fi boom-bap", category: "musica" as const, description: "Mood alterno para piezas más reflexivas", icon: "🎶" },
];

function LibraryView() {
  const [filter, setFilter] = React.useState<string>("all");
  const filtered = filter === "all" ? LIBRARY_RESOURCES : LIBRARY_RESOURCES.filter((r) => r.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "referencias", "musica", "fonts"].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              filter === c ? "bg-primary/15 text-primary border-primary/40" : "border-border/40 text-muted-foreground hover:bg-muted/40",
            )}
          >
            {c === "all" ? "Todo" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <TextureCard key={r.title} className="p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{r.icon}</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold">{r.title}</h4>
                <Badge variant="outline" className="text-[9px] mt-0.5">{r.category}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{r.description}</p>
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition">
                Abrir <ExternalLink className="size-2.5" />
              </a>
            )}
          </TextureCard>
        ))}
      </div>
    </div>
  );
}

// ─── STUDIO CLI VIEW ───────────────────────────────────────────────────────

function StudioCLIView() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [briefForClaude, setBriefForClaude] = React.useState("");

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
    toast.success(`${label} copiado`);
  };

  const claudePrompt = briefForClaude.trim()
    ? `Usa la skill bewe-studio para generar contenido para Bewe.\n\nBRIEF:\n${briefForClaude}\n\nSigue estrictamente el brand kit de Bewe (paleta navy/aqua/emerald, Inter + Merriweather, NO emojis, NO #000/#FFF, NO morado). Genera reels/carruseles/portadas según corresponda.`
    : `Usa la skill bewe-studio para generar contenido para Bewe siguiendo estrictamente el brand kit (navy/aqua/emerald · Inter + Merriweather).`;

  return (
    <div className="space-y-4">
      <TextureCard className="p-5 bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.04] border-emerald-500/20">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-500/20">
            <Terminal className="size-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Bewe Studio (Local)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Para videos reales (Remotion + FFmpeg + Whisper) corres la skill en Claude Code. El dashboard te da el
              prompt pre-armado y te lleva ahí.
            </p>
            <a
              href="https://github.com/santiagovarela-afk/bewe-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
            >
              Repo bewe-studio en GitHub <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </TextureCard>

      <TextureCard className="p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Download className="size-4" /> 1. Instala la skill (una sola vez)
        </h4>
        <CommandBlock cmd={`git clone https://github.com/santiagovarela-afk/bewe-studio.git ~/.claude/skills/bewe-studio`} onCopy={copy} />
        <p className="text-[10px] text-muted-foreground">
          Después de esto, Claude Code activa la skill automáticamente cada vez que pides contenido de Bewe.
        </p>
      </TextureCard>

      <TextureCard className="p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Code className="size-4" /> 2. Dependencias externas
        </h4>
        <CommandBlock cmd="brew install ffmpeg python3" label="macOS · Linux usa apt/dnf equivalente" onCopy={copy} />
        <CommandBlock cmd="pip install openai-whisper" label="Transcripción de audio" onCopy={copy} />
        <CommandBlock cmd="cd ~/.claude/skills/bewe-studio/assets/template && npm install" label="Deps del template Remotion" onCopy={copy} />
      </TextureCard>

      <TextureCard className="p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Wand2 className="size-4" /> 3. Comandos comunes
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <CommandBlock cmd="npm run dev" label="Remotion Studio · edición visual" onCopy={copy} />
          <CommandBlock cmd="npm run render" label="Renderizar reel a MP4 (9:16)" onCopy={copy} />
          <CommandBlock cmd="npm run cover" label="Generar imagen portada" onCopy={copy} />
          <CommandBlock cmd="npm run story1" label="Story interactiva" onCopy={copy} />
        </div>
      </TextureCard>

      <TextureCard className="p-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="size-4" /> 4. Prompt builder para Claude Code
        </h4>
        <p className="text-xs text-muted-foreground">Describe lo que necesitas y te genero el prompt completo:</p>
        <Textarea
          value={briefForClaude}
          onChange={(e) => setBriefForClaude(e.target.value)}
          placeholder="Ej: Necesito un reel de 20s mostrando cómo Bewe automatiza WhatsApp para salones. Música deep house. Frase final: 'Pruébalo gratis 30 días'."
          rows={3}
          className="text-xs"
        />
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">Prompt generado</p>
          <pre className="text-[11px] text-emerald-100 whitespace-pre-wrap font-mono leading-relaxed">{claudePrompt}</pre>
          <Button onClick={() => copy(claudePrompt, "Prompt")} size="sm" variant="outline" className="gap-1.5 w-full">
            {copied === "Prompt" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            Copiar prompt para Claude Code
          </Button>
        </div>
      </TextureCard>
    </div>
  );
}

function CommandBlock({ cmd, label, onCopy }: { cmd: string; label?: string; onCopy: (text: string, label: string) => void }) {
  return (
    <div className="rounded-md border border-border/40 bg-black/30 p-2">
      {label && <p className="text-[9px] text-muted-foreground mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <code className="text-[11px] font-mono text-emerald-300 flex-1 break-all">{cmd}</code>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onCopy(cmd, "Comando")}>
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── CANVA VIEW ────────────────────────────────────────────────────────────

const CANVA_LINKS = [
  { title: "Nuevo Reel 9:16", url: "https://www.canva.com/design/play?category=tACFasH-mPo", icon: "🎬", description: "Inicia un Reel con dimensiones IG/TikTok" },
  { title: "Nuevo Carrusel 4:5", url: "https://www.canva.com/design/play?category=tACFasH-Q9o", icon: "📐", description: "Slides múltiples para feed IG/FB" },
  { title: "Nueva Historia", url: "https://www.canva.com/design/play?category=tACFasGoUjQ", icon: "📱", description: "Stories 9:16 con stickers y poll" },
  { title: "Post Feed cuadrado", url: "https://www.canva.com/design/play?category=tACFasJWHrw", icon: "📷", description: "Imagen 1:1 para feed" },
  { title: "Logo / Marca", url: "https://www.canva.com/design/play?category=tACFafQEZkc", icon: "✨", description: "Crear sub-marcas o variantes" },
  { title: "Templates de mi equipo", url: "https://www.canva.com/folder/all-team-templates", icon: "📚", description: "Templates compartidos del equipo Bewe" },
];

function CanvaView() {
  return (
    <div className="space-y-4">
      <TextureCard className="p-5 bg-gradient-to-br from-pink-500/[0.06] to-purple-500/[0.04] border-pink-500/20">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-pink-500/20">
            <ImageIcon className="size-6 text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Canva · acceso rápido</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Deep links a Canva con cada formato pre-configurado. Para tener el brand kit de Bewe disponible automáticamente,
              configura el <strong className="text-foreground">Brand Kit de Canva</strong> en tu cuenta del equipo con los
              colores y fuentes oficiales.
            </p>
            <a href="https://www.canva.com/brand" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300">
              Configurar Brand Kit en Canva <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </TextureCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CANVA_LINKS.map((link) => (
          <motion.a key={link.url} whileHover={{ y: -2 }} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
            <TextureCard className="p-4 h-full hover:border-pink-500/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-pink-500/15 text-xl shrink-0">{link.icon}</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    {link.title} <ExternalLink className="size-3 opacity-50" />
                  </h4>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{link.description}</p>
                </div>
              </div>
            </TextureCard>
          </motion.a>
        ))}
      </div>

      <TextureCard className="p-4 border-amber-500/20 bg-amber-500/[0.04]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/80">
            <p className="font-medium mb-1">¿Quieres integración real con Canva Connect API?</p>
            <p>
              Lo que ves arriba son deep-links (Opción A). Para crear/editar designs directamente desde el dashboard
              (Opción B) necesitamos registrar la app en Canva Developer + OAuth. ~2-3 horas. Avísame cuando lo decidas activar.
            </p>
          </div>
        </div>
      </TextureCard>
    </div>
  );
}

// ─── HISTORY VIEW ──────────────────────────────────────────────────────────

function HistoryView() {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);

  React.useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const refresh = () => setHistory(loadHistory());

  const wipe = () => {
    if (!confirm("¿Borrar TODO el histórico de generaciones?")) return;
    if (typeof window !== "undefined") {
      localStorage.removeItem("bw_open_design_history");
    }
    setHistory([]);
    toast.success("Histórico borrado");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <HistoryIcon className="size-4" /> Histórico de generaciones
          </h4>
          <p className="text-[10px] text-muted-foreground">
            {history.length} generaciones · localStorage de este navegador
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="size-3.5" />
          </Button>
          {history.length > 0 && (
            <Button onClick={wipe} variant="outline" size="sm" className="gap-1.5 text-rose-400 border-rose-500/30">
              <Trash2 className="size-3.5" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <TextureCard className="p-12 text-center">
          <HistoryIcon className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Sin generaciones todavía</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Cuando generes contenido en "Generador IA", aparecerá aquí con preview, brief y fecha.
          </p>
        </TextureCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...history].reverse().map((h) => (
            <TextureCard key={h.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{new Date(h.timestamp).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <Badge variant="outline" className="text-[9px]">{h.skillId}</Badge>
              </div>
              {h.previewDataUri && (
                <div className="aspect-square overflow-hidden rounded bg-muted/40">
                  <img src={h.previewDataUri} alt="" className="h-full w-full object-contain" />
                </div>
              )}
              <p className="text-xs line-clamp-3">{h.brief}</p>
            </TextureCard>
          ))}
        </div>
      )}
    </div>
  );
}
