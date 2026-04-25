import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export function loadEnv() {
  if (typeof process === "undefined") return;

  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
