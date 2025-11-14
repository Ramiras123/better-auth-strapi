import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "client.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ["better-auth"],
});
