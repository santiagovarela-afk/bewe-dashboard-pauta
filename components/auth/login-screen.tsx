"use client";
import * as React from "react";
import { motion } from "motion/react";
import { ArrowRight, Lock } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { AuroraBg } from "@/components/fx/aurora-bg";
import { NoiseBackdrop } from "@/components/fx/noise";
import { GradientHeading } from "@/components/fx/gradient-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { setUser } = useDashboard();
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: pass,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setErr(data.error || "Correo o contraseña incorrectos.");
        setSubmitting(false);
        return;
      }
      setUser({
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      });
    } catch (err) {
      setErr(
        "No pude validar (conexión perdida). Reintenta en unos segundos.",
      );
      // eslint-disable-next-line no-console
      console.error("login error", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background">
      <AuroraBg />
      <NoiseBackdrop opacity={0.06} />
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative w-[420px] max-w-[94vw] rounded-2xl border border-border/70",
          "bg-card/80 backdrop-blur-xl",
          "shadow-[0_25px_80px_-20px_hsl(var(--brand-violet)/0.5)]",
          "light:shadow-[0_25px_70px_-25px_hsl(var(--brand-violet)/0.28),0_2px_8px_-4px_hsl(240_12%_20%/0.12)]",
        )}
      >
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet)/0.5)] via-transparent to-[hsl(var(--brand-cyan)/0.35)] opacity-50 -z-10 blur-[2px]" />

        <div className="p-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-7"
          >
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] grid place-items-center">
                <span className="font-display font-bold text-white text-sm">b</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight">bewe</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-1 rounded border border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.1)] text-[hsl(var(--brand-violet))]">
              Pauta · OS
            </span>
          </motion.div>

          <GradientHeading as="h1" size="md" variant="aurora" className="mb-2">
            Control de pauta.
          </GradientHeading>
          <p className="text-sm text-muted-foreground mb-7">
            Acceso solo equipo Bewe
          </p>

          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@bewe.io"
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Contraseña</Label>
              <Input
                id="pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {err && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] rounded-lg px-3 py-2"
              >
                <Lock className="size-3.5" />
                {err}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="glow"
              size="lg"
              disabled={submitting}
              className="w-full mt-2"
            >
              {submitting ? "Entrando…" : "Entrar"}
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </form>

          <div className="mt-7 pt-5 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
            <span>Acceso restringido</span>
            <span className="font-mono">v2.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
