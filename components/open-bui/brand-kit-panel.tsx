"use client";
import * as React from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { Palette, Upload, X, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "./skills";

/**
 * Brand Kit Bewe · visual editor.
 *
 * - Click en un swatch → modal HSL picker · cambia color en local
 *   (no toca el BRAND const · sirve como preview/draft visual del kit).
 * - Drag & drop para reordenar swatches.
 * - Upload de logo (data URL local).
 * - Selector de font display (top Google Fonts).
 *
 * Persiste en localStorage `bw_brand_kit_draft_v1`. El draft se muestra al user
 * como "tu brand kit personalizado" — el endpoint /api/design/generate sigue
 * usando BRAND como fuente de verdad (el draft es para futuras integraciones).
 */

interface Swatch {
  key: string;
  name: string;
  hex: string;
}

const DEFAULT_SWATCHES: Swatch[] = [
  { key: "primary", name: "Primary", hex: BRAND.colors.primary },
  { key: "secondary", name: "Secondary", hex: BRAND.colors.secondary },
  { key: "accentAi", name: "Accent IA", hex: BRAND.colors.accentAi },
  { key: "inkDeep", name: "Ink Deep", hex: BRAND.colors.inkDeep },
  { key: "surfaceAqua", name: "Surface Aqua", hex: BRAND.colors.surfaceAqua },
  { key: "surfaceCream", name: "Surface Cream", hex: BRAND.colors.surfaceCream },
];

const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Manrope",
  "Plus Jakarta Sans",
  "DM Sans",
  "Space Grotesk",
];

const STORAGE_KEY = "bw_brand_kit_draft_v1";

interface Draft {
  swatches: Swatch[];
  logo: string | null;
  font: string;
}

function loadDraft(): Draft {
  if (typeof window === "undefined")
    return { swatches: DEFAULT_SWATCHES, logo: null, font: BRAND.fonts.display.split(",")[0].trim() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Draft;
      if (d.swatches?.length) return d;
    }
  } catch {
    /* ignore */
  }
  return { swatches: DEFAULT_SWATCHES, logo: null, font: "Inter" };
}

function saveDraft(d: Draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

export function BrandKitPanel() {
  const [draft, setDraft] = React.useState<Draft>(() => ({
    swatches: DEFAULT_SWATCHES,
    logo: null,
    font: "Inter",
  }));
  const [editingKey, setEditingKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(loadDraft());
  }, []);
  React.useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  function updateColor(key: string, hex: string) {
    setDraft((d) => ({
      ...d,
      swatches: d.swatches.map((s) => (s.key === key ? { ...s, hex } : s)),
    }));
  }

  function reorder(next: Swatch[]) {
    setDraft((d) => ({ ...d, swatches: next }));
  }

  function onLogoFile(file: File | null) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === "string") {
        setDraft((d) => ({ ...d, logo: r.result as string }));
      }
    };
    r.readAsDataURL(file);
  }

  const editing = draft.swatches.find((s) => s.key === editingKey) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Palette className="size-3.5 text-[hsl(var(--brand-violet))]" />
        <div className="text-[11px] font-bold uppercase tracking-[0.14em]">
          Brand kit Bewe
        </div>
      </div>

      {/* Logo */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
          Logo
        </div>
        <div className="flex items-center gap-2.5">
          <div className="size-14 rounded-md border border-border bg-secondary/40 grid place-items-center overflow-hidden shrink-0">
            {draft.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={draft.logo}
                alt="logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="font-display font-extrabold text-foreground text-base">
                Bewe
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-accent cursor-pointer transition-colors">
              <Upload className="size-3" />
              {draft.logo ? "Cambiar logo" : "Subir logo (SVG/PNG)"}
              <input
                type="file"
                accept="image/svg+xml,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {draft.logo && (
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, logo: null }))}
                className="ml-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paleta */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
            Paleta
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/50">
            arrastra · click para editar
          </div>
        </div>
        <Reorder.Group axis="y" values={draft.swatches} onReorder={reorder} className="space-y-1">
          {draft.swatches.map((s) => (
            <Reorder.Item
              key={s.key}
              value={s}
              className="flex items-center gap-2 text-[10.5px] py-1 px-1 rounded cursor-grab active:cursor-grabbing hover:bg-secondary/40"
              whileDrag={{ scale: 1.02 }}
            >
              <button
                type="button"
                onClick={() => setEditingKey(s.key)}
                className="size-5 rounded-md border border-border shrink-0 ring-offset-2 ring-offset-card hover:ring-2 hover:ring-[hsl(var(--brand-violet))] transition-all"
                style={{ background: s.hex }}
                aria-label={`Editar ${s.name}`}
              />
              <span className="text-foreground/80 font-medium flex-1">{s.name}</span>
              <span className="font-mono text-muted-foreground/70 text-[10px]">{s.hex.toUpperCase()}</span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Font */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
          <Type className="size-3" />
          Tipografía display
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_OPTIONS.map((f) => {
            const active = draft.font === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, font: f }))}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-left transition-colors",
                  active
                    ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.08)]"
                    : "border-border bg-card/40 hover:border-foreground/30",
                )}
                style={{ fontFamily: f }}
              >
                <div className="text-[12px] font-bold leading-tight">Aa Bb</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{f}</div>
              </button>
            );
          })}
        </div>
        <div className="text-[10px] flex items-center gap-1.5 pt-1 border-t border-border/40">
          <span className="font-serif text-foreground text-sm leading-none italic">IA</span>
          <span className="text-muted-foreground/80 text-[10px]">
            Merriweather italic · solo IA/Linda (locked)
          </span>
        </div>
      </div>

      {/* Tagline */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-2.5">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-1">
          Tagline
        </div>
        <p className="text-[10.5px] text-muted-foreground leading-snug italic">
          &ldquo;{BRAND.tagline}&rdquo;
        </p>
      </div>

      <AnimatePresence>
        {editing && (
          <ColorEditor
            swatch={editing}
            onClose={() => setEditingKey(null)}
            onChange={(hex) => updateColor(editing.key, hex)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ----------------- Color editor modal ----------------- */

function ColorEditor({
  swatch,
  onClose,
  onChange,
}: {
  swatch: Swatch;
  onClose: () => void;
  onChange: (hex: string) => void;
}) {
  const [h, setH] = React.useState(() => hexToHsl(swatch.hex).h);
  const [s, setS] = React.useState(() => hexToHsl(swatch.hex).s);
  const [l, setL] = React.useState(() => hexToHsl(swatch.hex).l);
  const hex = hslToHex(h, s, l);

  React.useEffect(() => {
    onChange(hex);
  }, [hex, onChange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border w-full max-w-[340px] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Editar color
            </div>
            <div className="text-sm font-bold">{swatch.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 grid place-items-center rounded-md hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Preview swatch */}
          <div
            className="h-20 rounded-lg border border-border shadow-inner"
            style={{ background: hex }}
          />

          <SliderRow label="H" value={h} max={360} onChange={setH} accent={`hsl(${h} 80% 50%)`} />
          <SliderRow label="S" value={s} max={100} onChange={setS} accent={`hsl(${h} ${s}% 50%)`} />
          <SliderRow label="L" value={l} max={100} onChange={setL} accent={`hsl(${h} 80% ${l}%)`} />

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              HEX
            </div>
            <input
              type="text"
              value={hex}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  const c = hexToHsl(v);
                  setH(c.h);
                  setS(c.s);
                  setL(c.l);
                }
              }}
              className="font-mono text-[12px] px-2 py-1 rounded border border-border bg-secondary/40 w-[110px] text-right"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SliderRow({
  label,
  value,
  max,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className="font-bold text-foreground">{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

/* ----------------- color utils ----------------- */

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "");
  if (m.length !== 6) return { h: 0, s: 0, l: 50 };
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to2 = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
