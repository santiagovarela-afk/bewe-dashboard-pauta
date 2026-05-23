"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Palette,
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  FileImage,
  Sparkles,
  Save,
  HelpCircle,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Reveal } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TldrawCanvas } from "@/components/open-bui/canvas";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bw_open_bui_doc";
const DOC_NAME_KEY = "bw_open_bui_name";

export function TabOpenBui() {
  const [docName, setDocName] = React.useState("Untitled · pieza nueva");
  const [editing, setEditing] = React.useState(false);
  const [resetCount, setResetCount] = React.useState(0);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Hydrate doc name + savedAt from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DOC_NAME_KEY);
      if (raw) setDocName(raw);
    } catch {
      /* ignore */
    }
    setSavedAt(new Date().toISOString());
  }, []);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commitName() {
    setEditing(false);
    try {
      localStorage.setItem(DOC_NAME_KEY, docName.trim() || "Untitled");
    } catch {
      /* ignore */
    }
  }

  function newDoc() {
    if (!confirm("Crear documento nuevo · se perderá el canvas actual. ¿Continuar?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      // tldraw v3 prefija sus claves con TLDRAW_DOCUMENT_v2 — borrar también
      Object.keys(localStorage)
        .filter((k) => k.startsWith("TLDRAW_") || k.includes(STORAGE_KEY))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setDocName("Untitled · pieza nueva");
    try {
      localStorage.setItem(DOC_NAME_KEY, "Untitled · pieza nueva");
    } catch {
      /* ignore */
    }
    setResetCount((n) => n + 1);
    setSavedAt(new Date().toISOString());
  }

  function exportHint() {
    alert(
      "Para exportar:\n\n" +
        "1. Selecciona los shapes que quieras exportar (Ctrl/Cmd + A para todos).\n" +
        "2. Click derecho → Export as → PNG / SVG.\n\n" +
        "También: menú superior izquierdo → Edit → Export.",
    );
  }

  return (
    <div className="space-y-6 max-w-[1500px]">
      <SectionHeader
        title="Open BUI"
        sub="Canvas embebido para diseñar piezas dentro del dashboard"
        right={
          <div className="flex items-center gap-2">
            <Badge variant="violet" className="font-mono">
              <Sparkles className="size-2.5 mr-1" /> tldraw
            </Badge>
            <Button asChild variant="ghost" size="sm">
              <a href="https://tldraw.dev/docs" target="_blank" rel="noreferrer">
                <HelpCircle className="size-3.5" /> Docs
              </a>
            </Button>
          </div>
        }
      />

      {/* TOOLBAR */}
      <Reveal>
        <TextureCard className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="size-10 grid place-items-center rounded-lg border border-[hsl(var(--brand-violet)/0.35)] bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))] shrink-0"
            >
              <Palette className="size-5" />
            </div>

            {/* Doc name editable */}
            <div className="flex-1 min-w-[200px]">
              {editing ? (
                <input
                  ref={inputRef}
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitName();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="w-full bg-transparent border-b border-[hsl(var(--brand-violet))] outline-none font-display font-bold tracking-[-0.015em] text-lg leading-tight"
                />
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="group inline-flex items-center gap-2 text-left"
                >
                  <span className="font-display font-bold tracking-[-0.015em] text-lg leading-tight">
                    {docName}
                  </span>
                  <Pencil className="size-3 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                </button>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                <Save className="size-2.5" /> Auto-save activo · localStorage
                {savedAt && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="font-mono">
                      sesión {new Date(savedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={newDoc}>
                <Plus className="size-3.5" /> Nuevo
              </Button>
              <Button variant="outline" size="sm" onClick={exportHint}>
                <FileImage className="size-3.5" /> Exportar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={newDoc}
                className="text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
              >
                <Trash2 className="size-3.5" /> Reset
              </Button>
            </div>
          </div>
        </TextureCard>
      </Reveal>

      {/* CANVAS HOST */}
      <Reveal delay={0.05}>
        <CanvasHost resetCount={resetCount} />
      </Reveal>

      {/* TIPS */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid md:grid-cols-3 gap-3"
      >
        <TipCard
          title="Atajos esenciales"
          items={[
            "V — selección · H — mano (pan)",
            "R — rectángulo · O — círculo · A — flecha",
            "T — texto · D — dibujo libre",
            "Ctrl/Cmd + Z — deshacer",
          ]}
          accent="var(--brand-violet)"
        />
        <TipCard
          title="Buenas prácticas"
          items={[
            "Una página por pieza (story, post, banner)",
            "Usa frames para definir aspect ratio",
            "Marca colores con la paleta de Bewe",
            "Exporta PNG @2x para redes",
          ]}
          accent="var(--brand-cyan)"
        />
        <TipCard
          title="Próximamente"
          items={[
            "Plantillas Bewe pre-cargadas",
            "Brand kit sincronizado con Anuncios",
            "Export directo → Parrilla",
            "Multiplayer (varios usuarios)",
          ]}
          accent="var(--brand-lime)"
        />
      </motion.div>
    </div>
  );
}

/**
 * Host del canvas con altura responsive. Usa una `key` que cambia cuando
 * pedimos reset para forzar re-mount del componente tldraw.
 */
function CanvasHost({ resetCount }: { resetCount: number }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-card overflow-hidden",
        "h-[640px] md:h-[720px]",
      )}
    >
      {/* tldraw v3 quiere ocupar 100% — wrapper relativo + inset-0 absolute */}
      <div className="absolute inset-0">
        <TldrawCanvas
          key={`canvas-${resetCount}`}
          persistenceKey="bw_open_bui_doc"
        />
      </div>
      <div className="pointer-events-none absolute top-2 left-2 z-10">
        <Badge variant="outline" className="font-mono backdrop-blur bg-background/60">
          <ExternalLink className="size-2.5 mr-1" /> Open BUI · v0.1
        </Badge>
      </div>
    </div>
  );
}

function TipCard({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <TextureCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h4>
        <span
          className="size-2 rounded-full"
          style={{ background: `hsl(${accent})`, boxShadow: `0 0 8px hsl(${accent} / 0.6)` }}
        />
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-[11px] text-foreground/85 leading-relaxed flex items-start gap-2">
            <span
              className="shrink-0 mt-1.5 size-1 rounded-full"
              style={{ background: `hsl(${accent})` }}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </TextureCard>
  );
}
