/**
 * Compiles src/api.ts to a .d.ts ambient declaration string and
 * writes it as the GAME_API_TYPES export in src/api-types.ts.
 *
 * Run via: tsx scripts/generate-api-types.ts
 * Or triggered automatically by the type-generator Vite plugin.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, "../src");
const inputFile = resolve(srcDir, "lib", "api.ts");
const outputFile = resolve(srcDir, "generated", "api.ts");

// Emit .d.ts for api.ts and all its transitive dependencies in memory.
// Collecting all files ensures referenced types (e.g. RobotData from types.ts)
// are included as ambient globals alongside the player API types.
const dtsChunks: string[] = [];

const program = ts.createProgram([inputFile], {
  declaration: true,
  emitDeclarationOnly: true,
  stripInternal: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
});

const { diagnostics } = program.emit(undefined, (fileName, text) => {
  if (fileName.endsWith(".d.ts") && fileName.startsWith(srcDir)) {
    dtsChunks.push(text);
  }
});

if (diagnostics.length > 0) {
  const host = ts.createCompilerHost({});
  for (const diag of diagnostics) {
    console.error(ts.formatDiagnostic(diag, host));
  }
  process.exit(1);
}

if (dtsChunks.length === 0) {
  console.error("TypeScript emitted no .d.ts content");
  process.exit(1);
}

// Combine all emitted chunks, strip import statements (all types become
// ambient globals), and transform module exports → ambient declarations
// so Monaco's addExtraLib treats them as globally available.
const ambient = dtsChunks
  .join("\n")
  .replace(/^import [^\n]+\n?/gm, "")
  .replace(/^export \{\};\n?/gm, "")
  .replace(/^export interface /gm, "declare interface ")
  .replace(/^export type /gm, "declare type ")
  .replace(/^export declare function /gm, "declare function ")
  .trim();

const output = [
  "// AUTO-GENERATED — do not edit manually.",
  "// Source: packages/cargo-dispatch/src/lib/api.ts",
  "// Regenerated automatically by the type-generator Vite plugin.",
  "",
  `export const GAME_API_TYPES = \`${ambient.replace("`", "\`")}\`;`,
  "",
].join("\n");

writeFileSync(outputFile, output, "utf-8");
console.log("✅ Generated src/api-types.ts from src/api.ts");
