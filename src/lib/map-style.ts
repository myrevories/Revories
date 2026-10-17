import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import type { MapLook } from "@/lib/map-widget";

// Vector basemap for the map widget: OpenFreeMap's "Liberty" (OpenMapTiles schema, no key),
// recoloured with an Apple-Maps-like palette. Before print/production volume, consider
// self-hosting tiles or a paid provider with the same schema (MapTiler, Stadia).

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

interface Palette {
  land: string;
  urban: string;
  water: string;
  waterLabel: string;
  park: string;
  parkLabel: string;
  wood: string;
  grass: string;
  ice: string;
  sand: string;
  hospital: string;
  school: string;
  building: string;
  buildingLine: string;
  road: string;
  roadCasing: string;
  major: string;
  majorCasing: string;
  motorway: string;
  motorwayCasing: string;
  rail: string;
  boundary: string;
  stateLine: string;
  label: string;
  labelSoft: string;
  halo: string;
  space: string;
  /** Natural Earth natural-colour terrain (green forests, tan deserts) at low zoom: [z0 opacity, fade-out zoom]. */
  terrain: [number, number];
}

const PALETTES: Record<Exclude<MapLook, "satellite">, Palette> = {
  // Apple Maps (light): saturated sky-blue water, vivid park greens, natural-colour
  // terrain when zoomed out, near-white streets on warm land, yellow-orange freeways.
  soft: {
    land: "#f4f1ea",
    urban: "#ebe7e0",
    water: "#7fc4f3",
    waterLabel: "#1f6aa5",
    park: "#a9dc8e",
    parkLabel: "#2f7d32",
    wood: "#b6e09d",
    grass: "#c6e7ad",
    ice: "#ffffff",
    sand: "#f8e6b4",
    hospital: "#fadadf",
    school: "#f6ecc9",
    building: "#e2ded7",
    buildingLine: "#d3cec5",
    road: "#ffffff",
    roadCasing: "#dcd7cf",
    major: "#ffffff",
    majorCasing: "#cfc8bd",
    motorway: "#fbcd5e",
    motorwayCasing: "#e3a93a",
    rail: "#c9c4bb",
    boundary: "#8f84a8",
    stateLine: "#a399b9",
    label: "#1c1c1e",
    labelSoft: "#6c6c70",
    halo: "#ffffff",
    space: "#e6f2fb",
    terrain: [0.95, 9],
  },
  // A calmer take on the same palette for busy layouts — same hues, less saturation.
  mono: {
    land: "#f3f2ef",
    urban: "#eae9e5",
    water: "#b4d5ec",
    waterLabel: "#4c7a9c",
    park: "#cfe5c2",
    parkLabel: "#4f7b51",
    wood: "#d6e9cb",
    grass: "#dcecd2",
    ice: "#ffffff",
    sand: "#efe6cf",
    hospital: "#f2e3e5",
    school: "#efe9d8",
    building: "#e3e2de",
    buildingLine: "#d6d4cf",
    road: "#ffffff",
    roadCasing: "#dddbd6",
    major: "#ffffff",
    majorCasing: "#d1cec8",
    motorway: "#f1e2bb",
    motorwayCasing: "#d8c79c",
    rail: "#d0cec9",
    boundary: "#a19cab",
    stateLine: "#aeaab6",
    label: "#3a3a3c",
    labelSoft: "#7c7c80",
    halo: "#ffffff",
    space: "#eef3f6",
    terrain: [0.45, 7],
  },
  // Extra-vivid: deeper blues and greens, punchier freeways — postcard colours.
  voyager: {
    land: "#f6f2e9",
    urban: "#ece6dc",
    water: "#5fb3f0",
    waterLabel: "#0f5a96",
    park: "#8fd270",
    parkLabel: "#22702a",
    wood: "#9fd781",
    grass: "#b8e397",
    ice: "#ffffff",
    sand: "#fbdf96",
    hospital: "#ffd2da",
    school: "#fbe8b0",
    building: "#e0d9cd",
    buildingLine: "#cfc6b6",
    road: "#ffffff",
    roadCasing: "#d8d0c3",
    major: "#fff6d6",
    majorCasing: "#e6cf8c",
    motorway: "#ffb938",
    motorwayCasing: "#de8f12",
    rail: "#c6bfb3",
    boundary: "#7e70a0",
    stateLine: "#9488b3",
    label: "#1c1c1e",
    labelSoft: "#5f5f64",
    halo: "#ffffff",
    space: "#dcedfa",
    terrain: [1, 10],
  },
  // Apple Maps dark: charcoal land, deep navy water, dark green parks, grey roads.
  dark: {
    land: "#232427",
    urban: "#2a2b2f",
    water: "#16314a",
    waterLabel: "#7fb2dc",
    park: "#1f3a26",
    parkLabel: "#7cc488",
    wood: "#1e3524",
    grass: "#22382a",
    ice: "#3a3d42",
    sand: "#3a3528",
    hospital: "#3b2a2e",
    school: "#35321f",
    building: "#34353a",
    buildingLine: "#2c2d31",
    road: "#45474e",
    roadCasing: "#232427",
    major: "#5a5d65",
    majorCasing: "#232427",
    motorway: "#9a7a3a",
    motorwayCasing: "#3a2f1a",
    rail: "#404248",
    boundary: "#7c7790",
    stateLine: "#6d697d",
    label: "#ececf0",
    labelSoft: "#a1a1a6",
    halo: "#141416",
    space: "#0d0e11",
    terrain: [0.35, 7],
  },
};

// Things Apple-style maps leave out at book scale.
const HIDE = /(one_way|shield|poi_r7|poi_r20|wetland|road_area_pattern|hatching|building-3d|park_outline|tunnel_)/;

function paintFor(id: string, type: string, p: Palette): Record<string, unknown> | null {
  const is = (re: RegExp) => re.test(id);
  if (type === "background") return { "background-color": p.land };
  if (type === "raster") return { "raster-opacity": ["interpolate", ["linear"], ["zoom"], 0, p.terrain[0], 4, p.terrain[0] * 0.8, p.terrain[1], 0] };
  if (type === "fill") {
    if (id === "water") return { "fill-color": p.water };
    if (is(/park|pitch|track|cemetery/)) return { "fill-color": p.park, "fill-opacity": 1 };
    if (is(/wood/)) return { "fill-color": p.wood, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 0.85] };
    if (is(/grass/)) return { "fill-color": p.grass, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.4, 10, 0.75] };
    if (is(/ice/)) return { "fill-color": p.ice, "fill-opacity": 0.9 };
    if (is(/sand/)) return { "fill-color": p.sand };
    if (is(/residential/)) return { "fill-color": p.urban, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.9, 14, 0.5] };
    if (is(/hospital/)) return { "fill-color": p.hospital };
    if (is(/school/)) return { "fill-color": p.school };
    if (is(/aeroway/)) return { "fill-color": p.urban, "fill-opacity": 1 };
    if (id === "building") return { "fill-color": p.building, "fill-outline-color": p.buildingLine };
  }
  if (type === "line") {
    if (is(/^waterway/)) return { "line-color": p.water };
    if (is(/aeroway/)) return { "line-color": p.major };
    if (is(/rail/)) return { "line-color": p.rail };
    // Country borders solid; state/province lines dashed and visible from continent scale.
    if (id === "boundary_3") return { "line-color": p.stateLine, "line-dasharray": [2.5, 1.5], "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.8, 7, 1.3, 12, 1.8] };
    if (is(/^boundary/)) return { "line-color": p.boundary };
    const casing = is(/casing/);
    if (is(/motorway/)) return { "line-color": casing ? p.motorwayCasing : p.motorway };
    if (is(/trunk|primary|secondary|tertiary|_link/)) return { "line-color": casing ? p.majorCasing : p.major };
    if (is(/minor|street|service|path|pedestrian/)) return { "line-color": casing ? p.roadCasing : p.road };
  }
  if (type === "symbol") {
    if (is(/water|waterway/)) return { "text-color": p.waterLabel, "text-halo-color": p.halo, "text-halo-width": 1.2 };
    if (is(/poi/)) return { "text-color": p.parkLabel, "text-halo-color": p.halo, "text-halo-width": 1.2 };
    const soft = is(/highway-name|airport|label_other|label_state/);
    return { "text-color": soft ? p.labelSoft : p.label, "text-halo-color": p.halo, "text-halo-width": 1.4, "text-halo-blur": 0.4 };
  }
  return null;
}

let basePromise: Promise<StyleSpecification> | null = null;
function loadBase() {
  basePromise ??= fetch(BASE_STYLE_URL).then((r) => r.json() as Promise<StyleSpecification>);
  return basePromise;
}

const styleCache = new Map<string, Promise<StyleSpecification>>();

/**
 * The full MapLibre style for a look, with a globe projection and a soft atmosphere.
 * `globe` is the whole-Earth view: no labels, and Natural Earth relief for a real-globe feel.
 */
export function styleFor(look: MapLook, globe = false): Promise<StyleSpecification> {
  const key = `${look}:${globe}`;
  if (!styleCache.has(key)) styleCache.set(key, loadBase().then((base) => build(base, look, globe)));
  return styleCache.get(key)!;
}

function build(base: StyleSpecification, look: MapLook, globe: boolean): StyleSpecification {
  const satellite = look === "satellite";
  const p = PALETTES[satellite ? "dark" : look];
  const layers: LayerSpecification[] = [];
  for (const l of base.layers) {
    if (HIDE.test(l.id)) continue;
    if (globe && l.type === "symbol") continue;
    // Satellite = imagery + borders + place/water labels (Apple's "Hybrid" without road clutter).
    if (satellite && l.id.startsWith("boundary")) {
      layers.push({ ...l, paint: { ...("paint" in l ? l.paint : {}), "line-color": "rgba(255,255,255,0.7)" } } as LayerSpecification);
      continue;
    }
    if (satellite && l.type !== "symbol") continue;
    if (satellite && /poi|highway|airport/.test(l.id)) continue;
    const paint = satellite
      ? { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.55)", "text-halo-width": 1.4, "text-halo-blur": 0.6 }
      : paintFor(l.id, l.type, p);
    if (globe && l.type === "raster" && paint) paint["raster-opacity"] = look === "mono" ? 0.5 : 1;
    let next = paint ? ({ ...l, paint: { ...("paint" in l ? l.paint : {}), ...paint } } as LayerSpecification) : l;
    // One name per label, English first (Liberty shows "Fira / Φηρά").
    if (next.type === "symbol" && next.layout?.["text-field"] && !/shield|one_way/.test(next.id))
      next = { ...next, layout: { ...next.layout, "text-field": ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]] } };
    if (next.id === "boundary_3") next = { ...next, minzoom: 0 };
    layers.push(next);
  }
  const sources = { ...base.sources };
  if (satellite) {
    sources.satellite = { type: "raster", tiles: [SATELLITE_URL], tileSize: 256, maxzoom: 19, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" };
    layers.unshift({ id: "satellite", type: "raster", source: "satellite" }, { id: "sat-bg", type: "background", paint: { "background-color": "#0b1a2a" } });
    // Background must sit under the imagery.
    layers.unshift(layers.splice(1, 1)[0]);
  }
  return {
    ...base,
    sources,
    layers,
    projection: { type: "globe" },
    sky: {
      "sky-color": p.space,
      "horizon-color": satellite || look === "dark" ? "#2a3a52" : "#ffffff",
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 5, 0.4, 7, 0],
    },
  };
}
