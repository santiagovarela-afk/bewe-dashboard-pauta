"use client";
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { useDashboard } from "@/lib/store";
import { LoginScreen } from "@/components/auth/login-screen";
import { TabDashboard } from "@/components/tabs/tab-dashboard";
import { TabCampanas } from "@/components/tabs/tab-campanas";
import { TabEstrategia } from "@/components/tabs/tab-estrategia";
import { TabAnuncios } from "@/components/tabs/tab-anuncios";
import { TabOrganico } from "@/components/tabs/tab-organico";
import { TabParrilla } from "@/components/tabs/tab-parrilla";
import { TabInforme } from "@/components/tabs/tab-informe";
import { TabConfig } from "@/components/tabs/tab-config";
import { TabPaid } from "@/components/tabs/tab-paid";
import { TabSeo } from "@/components/tabs/tab-seo";
import { TabAeo } from "@/components/tabs/tab-aeo";
import { TabPerformance } from "@/components/tabs/tab-performance";
import { TabOpenBui } from "@/components/tabs/tab-open-bui";
import { NoiseBackdrop } from "@/components/fx/noise";
import { AiDock } from "@/components/ai-dock/ai-dock";
import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger";

const TAB_MAP: Record<string, React.ComponentType> = {
  dashboard: TabDashboard,
  campanas: TabCampanas,
  estrategia: TabEstrategia,
  paid: TabPaid,
  anuncios: TabAnuncios,
  organico: TabOrganico,
  parrilla: TabParrilla,
  seo: TabSeo,
  aeo: TabAeo,
  performance: TabPerformance,
  "open-bui": TabOpenBui,
  informe: TabInforme,
  config: TabConfig,
};

export function AppShell() {
  const { user, tab } = useDashboard();
  if (!user) return <LoginScreen />;

  const Active = TAB_MAP[tab] ?? TabDashboard;

  return (
    <div className="relative flex min-h-screen w-full bg-background overflow-x-hidden">
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.18] pointer-events-none -z-10" />
      <NoiseBackdrop opacity={0.04} />

      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <div className="flex-1 px-4 md:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Active />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating AI dock — persistente en todas las tabs */}
      <AiDock />

      {/* Welcome tour la primera vez tras login (también re-disparable desde Config) */}
      <OnboardingTrigger />
    </div>
  );
}
