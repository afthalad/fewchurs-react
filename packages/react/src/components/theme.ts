import type { CSSProperties } from "react";

export interface BoardTheme {
  primary?: string;
  /** A number is read as pixels, a string is used as-is (`"0.75rem"`). */
  radius?: number | string;
  surface?: string;
  border?: string;
  text?: string;
  subtle?: string;
  font?: string;
}

const VARIABLE_BY_KEY: Record<keyof BoardTheme, string> = {
  primary: "--fw-primary",
  radius: "--fw-radius",
  surface: "--fw-surface",
  border: "--fw-border",
  text: "--fw-text",
  subtle: "--fw-subtle",
  font: "--fw-font",
};

export function themeToStyle(theme?: BoardTheme): CSSProperties | undefined {
  if (!theme) return undefined;
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value === undefined || value === null) continue;
    const variable = VARIABLE_BY_KEY[key as keyof BoardTheme];
    style[variable] = typeof value === "number" ? `${value}px` : value;
  }
  return style as CSSProperties;
}
