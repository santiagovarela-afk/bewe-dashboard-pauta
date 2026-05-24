/**
 * Helper para resolver paths de persistencia local.
 *
 * En Vercel/serverless el filesystem es read-only excepto `/tmp` (que se
 * limpia entre invocaciones · NO es durable). Esto evita el error
 * `ENOENT: no such file or directory, mkdir '/var/task/.data'`.
 *
 * Uso:
 *   import { resolveDataPath } from "@/lib/data-paths";
 *   const file = resolveDataPath("aeo-results.json");
 */
import path from "node:path";

/**
 * Devuelve un path bajo `.data/` que sea escribible en el runtime actual.
 * - Local dev: `cwd()/.data/<file>` (durable)
 * - Vercel / Lambda: `/tmp/.data/<file>` (efímero · vive lo que dure el contenedor)
 */
export function resolveDataPath(...segments: string[]): string {
  const isServerless = Boolean(process.env.VERCEL) || Boolean(process.env.LAMBDA_TASK_ROOT);
  const base = isServerless ? "/tmp/.data" : path.join(process.cwd(), ".data");
  return path.join(base, ...segments);
}

/** Lo mismo que resolveDataPath pero solo el directorio base. */
export function resolveDataDir(): string {
  const isServerless = Boolean(process.env.VERCEL) || Boolean(process.env.LAMBDA_TASK_ROOT);
  return isServerless ? "/tmp/.data" : path.join(process.cwd(), ".data");
}

/** True si estamos en un entorno donde la persistencia es efímera. */
export function isEphemeralStorage(): boolean {
  return Boolean(process.env.VERCEL) || Boolean(process.env.LAMBDA_TASK_ROOT);
}
