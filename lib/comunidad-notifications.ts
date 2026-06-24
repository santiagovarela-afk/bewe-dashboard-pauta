/**
 * Comunidad · Notificaciones desktop (Browser Notification API)
 *
 * Se dispara cuando:
 * 1. Al cargar el dashboard hay pendientes acumulados (resumen al entrar)
 * 2. (Próximo · con webhook) Llega un comentario/mensaje nuevo en tiempo real
 */

const NOTIF_KEY = "bewe_comunidad_notif_perm";
const LAST_NOTIF_KEY = "bewe_comunidad_last_notif";

export type NotifPermission = "granted" | "denied" | "default";

export function getNotifPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission as NotifPermission;
}

/** Pide permiso al usuario para mostrar notificaciones. */
export async function requestNotifPermission(): Promise<NotifPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result as NotifPermission;
  } catch {
    return "denied";
  }
}

/** Muestra una notificación si hay permiso. Throttle 5min por título. */
export function showNotification(
  title: string,
  options?: { body?: string; icon?: string; url?: string },
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  // Throttle: no repetir la misma notificación en <5 min
  try {
    const last = JSON.parse(localStorage.getItem(LAST_NOTIF_KEY) || "{}");
    const lastTs = last[title];
    if (lastTs && Date.now() - lastTs < 5 * 60 * 1000) return false;
    last[title] = Date.now();
    localStorage.setItem(LAST_NOTIF_KEY, JSON.stringify(last));
  } catch {
    /* ignore */
  }

  try {
    const n = new Notification(title, {
      body: options?.body,
      icon: options?.icon ?? "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: false,
      silent: false,
    });
    if (options?.url) {
      n.onclick = () => {
        window.focus();
        window.location.href = options.url!;
        n.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}
