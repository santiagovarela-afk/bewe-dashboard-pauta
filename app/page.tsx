import { DashboardProvider } from "@/lib/store";
import { AppShell } from "@/components/shell/app-shell";

export default function Page() {
  return (
    <DashboardProvider>
      <AppShell />
    </DashboardProvider>
  );
}
