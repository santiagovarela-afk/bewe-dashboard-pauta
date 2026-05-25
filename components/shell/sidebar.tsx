"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Megaphone,
  Target,
  Image as ImageIcon,
  Sparkles,
  CalendarDays,
  FileText,
  Bot,
  Settings2,
  LogOut,
  TrendingUp,
  Search,
  Gauge,
  Palette,
  Brain,
} from "lucide-react";
import { TABS, TAB_GROUPS, ROLE_TABS, PLAN } from "@/lib/config";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Megaphone,
  Target,
  Image: ImageIcon,
  Sparkles,
  CalendarDays,
  FileText,
  Bot,
  Settings2,
  TrendingUp,
  Search,
  Gauge,
  Palette,
  Brain,
};

export function Sidebar() {
  const { tab, setTab, user, setUser, campaigns } = useDashboard();
  const allowed = user ? ROLE_TABS[user.role] : [];

  // Count alerts dinamically — campañas con cpt > critical or anomaly
  const alertCount = React.useMemo(() => {
    return campaigns.filter((c) => c.flag === "critical" || c.flag === "warn" || c.flag === "anomaly").length;
  }, [campaigns]);

  return (
    <aside data-tour="sidebar" className="hidden md:flex flex-col w-[232px] shrink-0 sticky top-0 h-screen border-r border-border/70 bg-card/40 light:bg-card/80 backdrop-blur-xl z-40">
      {/* logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5 border-b border-border/60">
        <div className="size-7 rounded-md bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] grid place-items-center shadow-[0_4px_18px_-4px_hsl(var(--brand-violet)/0.55)]">
          <span className="font-display font-bold text-white text-sm">b</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-base font-bold tracking-tight leading-none">
            bewe
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--brand-violet))] mt-1">
            Pauta · OS
          </span>
        </div>
      </div>

      {/* nav · agrupado */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-3 overflow-y-auto">
        {TAB_GROUPS.map((group) => {
          const groupTabs = TABS.filter((t) => t.group === group.id);
          const visible = groupTabs.filter((t) => allowed.includes(t.id));
          if (visible.length === 0) return null;
          return (
            <div key={group.id} data-tour-group={group.id} className="flex flex-col gap-0.5">
              <div className="px-3 mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
                {group.label}
              </div>
              {groupTabs.map((t) => {
                const Icon = ICONS[t.icon] ?? LayoutDashboard;
                const isAllowed = allowed.includes(t.id);
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    data-tour-tab={t.id}
                    onClick={() => isAllowed && setTab(t.id)}
                    disabled={!isAllowed}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors text-left",
                      isAllowed
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground/25 cursor-not-allowed",
                      isActive && isAllowed && "text-foreground",
                    )}
                  >
                    {isActive && isAllowed && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-secondary/80 border border-border/80"
                        style={{ borderRadius: 10 }}
                        transition={{ type: "spring", stiffness: 480, damping: 38 }}
                      />
                    )}
                    <span className="relative z-10 grid place-items-center">
                      <Icon
                        className={cn(
                          "size-[14px] transition-colors",
                          isActive && isAllowed && "text-[hsl(var(--brand-violet))]",
                        )}
                      />
                    </span>
                    <span className="relative z-10 flex-1">{t.label}</span>
                    {"badge" in t && t.badge && alertCount > 0 && isAllowed && (
                      <span className="relative z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[9px] font-bold bg-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.4)]">
                        {alertCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* foot */}
      <div className="px-4 py-4 border-t border-border/60 space-y-3">
        <div className="text-[10px] leading-relaxed text-muted-foreground">
          <div className="font-bold text-foreground/80 text-[11px] mb-0.5">
            {user?.name ?? "—"}
          </div>
          <div className="font-mono text-[10px]">{PLAN.meta.accountId.slice(0, 13)}…</div>
          <div className="uppercase tracking-[0.1em] mt-0.5">
            {user?.role ?? "—"} · {PLAN.monthLabel}
          </div>
        </div>
        <button
          onClick={() => setUser(null)}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <LogOut className="size-3" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
