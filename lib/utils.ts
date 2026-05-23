import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  eur: (v: number | null | undefined, opts: { decimals?: number } = {}) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: opts.decimals ?? 2,
      maximumFractionDigits: opts.decimals ?? 2,
    }).format(v);
  },
  pct: (v: number | null | undefined, decimals = 2) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return `${v.toFixed(decimals)}%`;
  },
  int: (v: number | null | undefined) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return new Intl.NumberFormat("es-ES").format(Math.round(v));
  },
  short: (v: number | null | undefined) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "k";
    return v.toString();
  },
};

export function escapeHtml(input: unknown): string {
  return String(input ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

/** Days elapsed since launch (clamped to 0..20) */
export function daysSince(launchISO: string, max = 20) {
  const launch = new Date(launchISO).getTime();
  return Math.max(0, Math.min(Math.floor((Date.now() - launch) / 864e5), max));
}

export function daysUntil(targetISO: string) {
  const target = new Date(targetISO).getTime();
  return Math.ceil((target - Date.now()) / 864e5);
}

/** CPT classification → tone */
export type Tone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "lime"
  | "ember"
  | "cyan";

export const CPT_THRESHOLDS = { target: 2.2, warn: 3.0, critical: 5.5 };

export function cptTone(v: number | null | undefined): Tone {
  if (v === null || v === undefined) return "default";
  if (v <= CPT_THRESHOLDS.target) return "success";
  if (v <= CPT_THRESHOLDS.warn) return "warning";
  return "danger";
}

export function ctrTone(v: number | null | undefined): Tone {
  if (v === null || v === undefined) return "default";
  if (v >= 1.5) return "success";
  if (v >= 1.0) return "warning";
  return "danger";
}

export function cpmTone(v: number | null | undefined): Tone {
  if (v === null || v === undefined) return "default";
  if (v <= 9) return "success";
  if (v <= 12) return "warning";
  return "danger";
}
