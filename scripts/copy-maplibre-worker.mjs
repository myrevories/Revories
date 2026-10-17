// MapLibre v6 starts its web worker from a URL next to its own module, which Turbopack
// doesn't serve. Copy the worker (and the chunk it imports) into /public instead;
// map-widget.tsx points setWorkerUrl at it. Runs on postinstall.
import { copyFileSync, mkdirSync } from "node:fs";

const from = "node_modules/maplibre-gl/dist";
const to = "public/vendor/maplibre";
mkdirSync(to, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(`${from}/${f}`, `${to}/${f}`);
