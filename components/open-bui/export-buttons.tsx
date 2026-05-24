"use client";
import * as React from "react";
import { Download, FileCode, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Skill } from "./skills";

interface ExportButtonsProps {
  skill: Skill;
  html: string | null;
  briefHint?: string;
}

/**
 * Botones de export. PNG usa html2canvas dinámico desde unpkg (CDN) para no
 * forzar npm install. Si falla la red, cae a "copiar HTML" como plan B.
 */
export function ExportButtons({ skill, html, briefHint }: ExportButtonsProps) {
  const [busy, setBusy] = React.useState<"png" | "html" | null>(null);

  const filename = React.useMemo(() => {
    const slug = (briefHint || skill.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return `bewe_${skill.id}_${slug || "design"}`;
  }, [briefHint, skill.id]);

  function downloadHtml() {
    if (!html) return;
    setBusy("html");
    try {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  async function downloadPng() {
    if (!html) return;
    setBusy("png");
    try {
      // Render off-screen en un iframe a tamaño nativo y captura con html2canvas
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-99999px";
      iframe.style.top = "0";
      iframe.style.width = `${skill.width}px`;
      iframe.style.height = `${skill.height}px`;
      iframe.style.border = "0";
      iframe.setAttribute("sandbox", "allow-same-origin");
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument;
      if (!doc) throw new Error("iframe sin document");
      doc.open();
      doc.write(html);
      doc.close();
      // Esperar a que fonts/imagenes carguen
      await new Promise((res) => setTimeout(res, 400));

      const mod = await loadHtml2Canvas();
      if (!mod) {
        // Fallback: descarga HTML
        document.body.removeChild(iframe);
        alert(
          "No se pudo cargar html2canvas (offline?). Te exporto el HTML en su lugar.",
        );
        downloadHtml();
        return;
      }
      const canvas = await mod(doc.body, {
        width: skill.width,
        height: skill.height,
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: 1,
      });
      document.body.removeChild(iframe);
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    } catch (e) {
      console.error("[open-design] export png failed", e);
      alert("No se pudo exportar PNG. Prueba con HTML.");
    } finally {
      setBusy(null);
    }
  }

  const disabled = !html;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || busy !== null}
        onClick={downloadPng}
      >
        {busy === "png" ? (
          <Download className="size-3.5 animate-pulse" />
        ) : (
          <ImageDown className="size-3.5" />
        )}
        Export PNG
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || busy !== null}
        onClick={downloadHtml}
      >
        <FileCode className="size-3.5" /> Export HTML
      </Button>
    </div>
  );
}

/**
 * Carga html2canvas dinámicamente:
 * 1. Intenta `import("html2canvas")` (por si ya está instalado).
 * 2. Si falla, inyecta el script desde unpkg y usa window.html2canvas.
 *
 * Devuelve la función html2canvas o null si ambas estrategias fallan.
 */
type Html2CanvasFn = (
  el: HTMLElement,
  opts: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

async function loadHtml2Canvas(): Promise<Html2CanvasFn | null> {
  // Estrategia 1: dynamic import (html2canvas en package.json)
  try {
    const mod = await import("html2canvas");
    const fn = (mod?.default ?? mod) as unknown as Html2CanvasFn | undefined;
    if (typeof fn === "function") return fn;
  } catch {
    /* fallthrough a CDN */
  }
  // Estrategia 2: CDN unpkg
  try {
    const win = window as unknown as { html2canvas?: Html2CanvasFn };
    if (win.html2canvas) return win.html2canvas;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("CDN load failed"));
      document.head.appendChild(s);
    });
    return win.html2canvas ?? null;
  } catch {
    return null;
  }
}
