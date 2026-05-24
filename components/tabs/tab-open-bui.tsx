"use client";
import * as React from "react";
import { Plus, Pencil, FileImage, Maximize2, Save } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TldrawCanvas } from "@/components/open-bui/canvas";

const DOC_NAME_KEY = "bw_open_bui_name";
const DEFAULT_NAME = "Pieza sin título · 22 may";

/**
 * Tipo mínimo del editor de tldraw que usamos.
 * Evitamos importar el tipo real para no forzar la dependencia en SSR.
 */
type TldrawEditor = {
  zoomToFit: (opts?: unknown) => void;
  getCurrentPageShapeIds: () => Set<string>;
  store: { listen: (cb: () => void) => () => void };
};

export function TabOpenBui() {
  const [docName, setDocName] = React.useState(DEFAULT_NAME);
  const [editing, setEditing] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [savedAgo, setSavedAgo] = React.useState<string>("ahora");

  const editorRef = React.useRef<TldrawEditor | null>(null);
  const lastChangeRef = React.useRef<number>(Date.now());
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Hidratar nombre del doc
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DOC_NAME_KEY);
      if (raw) setDocName(raw);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Refrescar el chip "Guardado · hace X" cada 5s
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const secs = Math.max(0, Math.round((Date.now() - lastChangeRef.current) / 1000));
      if (secs < 5) setSavedAgo("ahora");
      else if (secs < 60) setSavedAgo(`hace ${secs}s`);
      else setSavedAgo(`hace ${Math.floor(secs / 60)} min`);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  function commitName() {
    setEditing(false);
    const next = docName.trim() || DEFAULT_NAME;
    setDocName(next);
    try {
      localStorage.setItem(DOC_NAME_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function handleMount(editor: unknown) {
    const ed = editor as TldrawEditor;
    editorRef.current = ed;
    // Auto-save indicator: tldraw persiste solo (IndexedDB), nosotros solo
    // marcamos el tiempo del último cambio para mostrar el chip.
    try {
      ed.store.listen(() => {
        lastChangeRef.current = Date.now();
      });
    } catch {
      /* ignore */
    }
  }

  function newDoc() {
    if (!confirm("¿Crear documento nuevo? Se perderá el canvas actual.")) return;
    try {
      // tldraw v3 guarda en IndexedDB con prefijo TLDRAW_DOCUMENT_v2_<key>
      indexedDB.databases?.().then((dbs) => {
        for (const db of dbs ?? []) {
          if (db.name?.includes("bw_open_bui_doc")) indexedDB.deleteDatabase(db.name);
        }
      });
      // localStorage residual por si hubo
      Object.keys(localStorage)
        .filter((k) => k.startsWith("TLDRAW_") || k.includes("bw_open_bui_doc"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setDocName(DEFAULT_NAME);
    try {
      localStorage.setItem(DOC_NAME_KEY, DEFAULT_NAME);
    } catch {
      /* ignore */
    }
    setReloadKey((n) => n + 1);
    lastChangeRef.current = Date.now();
  }

  async function exportPng() {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      const ids = Array.from(ed.getCurrentPageShapeIds());
      if (ids.length === 0) {
        alert("El canvas está vacío · dibuja algo antes de exportar.");
        return;
      }
      const { exportToBlob } = await import("tldraw");
      const blob = await exportToBlob({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor: ed as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ids: ids as any,
        format: "png",
        opts: { background: true, scale: 2 },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docName.replace(/[^a-z0-9-_]+/gi, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[open-bui] export failed", e);
      alert("No se pudo exportar el PNG.");
    }
  }

  function zoomFit() {
    editorRef.current?.zoomToFit();
  }

  return (
    <div className="space-y-4 max-w-[1500px]">
      <SectionHeader
        title="Open BUI"
        sub="Canvas embebido · diseña piezas dentro del dashboard"
        right={
          <Badge variant="violet" className="font-mono">
            tldraw v3
          </Badge>
        }
      />

      {/* TOOLBAR MINIMAL */}
      <div className="flex items-center gap-2 flex-wrap">
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
              className="w-full bg-transparent border-b border-[hsl(var(--brand-violet))] outline-none font-display font-bold tracking-[-0.015em] text-base leading-tight"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="group inline-flex items-center gap-2 text-left"
            >
              <span className="font-display font-bold tracking-[-0.015em] text-base leading-tight">
                {docName}
              </span>
              <Pencil className="size-3 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono px-2 py-1 rounded-md bg-secondary/60 border border-border">
            <Save className="size-2.5 text-[hsl(var(--success))]" />
            Guardado · {savedAgo}
          </span>
          <Button variant="outline" size="sm" onClick={newDoc}>
            <Plus className="size-3.5" /> Nuevo
          </Button>
          <Button variant="outline" size="sm" onClick={zoomFit}>
            <Maximize2 className="size-3.5" /> Centrar
          </Button>
          <Button variant="outline" size="sm" onClick={exportPng}>
            <FileImage className="size-3.5" /> Exportar PNG
          </Button>
        </div>
      </div>

      {/* CANVAS FULL-HEIGHT */}
      <div className="w-full h-[calc(100vh-220px)] min-h-[520px] rounded-xl border border-border bg-card overflow-hidden relative">
        <TldrawCanvas
          key={`canvas-${reloadKey}`}
          persistenceKey="bw_open_bui_doc"
          onMount={handleMount}
        />
      </div>
    </div>
  );
}
