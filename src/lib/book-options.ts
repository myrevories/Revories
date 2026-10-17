/**
 * Print formats a story can be made into: cover type (binding), trim size and
 * design style. Shared by the storyboard, the book-options page and the cover
 * preview so labels and explanations stay in one place.
 */

export type CoverId = "softcover" | "hardcover" | "layflat" | "linen";

export interface CoverOption {
  id: CoverId;
  name: string;
  tagline: string;
  description: string;
  details: string[];
  bestFor: string;
  pages: string;
  price: 1 | 2 | 3;
  /** Spine thickness in preview pixels. */
  thickness: number;
}

export const COVERS: CoverOption[] = [
  {
    id: "softcover",
    name: "Softcover",
    tagline: "Light, flexible, easy to share",
    description: "A flexible printed cover wrapped around glued pages — like a premium magazine or paperback.",
    details: ["Glossy printed photo cover", "Perfect-bound (glued) spine", "Pages open about 80% of the way"],
    bestFor: "Gifting several copies, shorter trips, everyday flip-through books",
    pages: "20–100 pages",
    price: 1,
    thickness: 6,
  },
  {
    id: "hardcover",
    name: "Hardcover",
    tagline: "The classic coffee table book",
    description: "Rigid boards wrapped in your printed cover photo, with sewn pages that hold up to years of handling.",
    details: ["Printed photo wrap with matte or gloss laminate", "Rigid boards with a hinged spine", "Sewn binding, pages open about 90%"],
    bestFor: "Most family books — durable and display-worthy",
    pages: "20–200 pages",
    price: 2,
    thickness: 16,
  },
  {
    id: "layflat",
    name: "Layflat Hardcover",
    tagline: "Panoramas across both pages",
    description: "Thick, stiff pages bonded at the spine so the book opens completely flat — photos can run edge to edge across the fold.",
    details: ["Printed photo wrap hardcover", "Thick photographic pages", "Opens 180° with no gutter"],
    bestFor: "Landscapes, weddings and big group photos that span a spread",
    pages: "20–80 pages",
    price: 3,
    thickness: 24,
  },
  {
    id: "linen",
    name: "Linen Heritage",
    tagline: "Heirloom cloth cover",
    description: "Hand-feel linen cloth over rigid boards, with your title foil-stamped and a single photo set into a debossed window.",
    details: ["Linen cloth cover in a heritage color", "Foil-stamped title and spine", "Inset photo window, sewn pages"],
    bestFor: "Family histories and keepsakes meant to be passed down",
    pages: "20–200 pages",
    price: 3,
    thickness: 18,
  },
];

export interface SizeOption {
  id: string;
  label: string;
  short: string;
  shape: "Landscape" | "Portrait" | "Square";
  /** width / height in inches */
  w: number;
  h: number;
  description: string;
}

export const SIZES: SizeOption[] = [
  { id: "11 x 8.5 in (Landscape)", label: "11 × 8.5 in", short: "11 × 8.5 in", shape: "Landscape", w: 11, h: 8.5, description: "Our most popular. Wide pages suit scenery and group photos." },
  { id: "8.5 x 11 in (Portrait)", label: "8.5 × 11 in", short: "8.5 × 11 in", shape: "Portrait", w: 8.5, h: 11, description: "Tall like a magazine. Great for portraits and text-heavy stories." },
  { id: "12 x 12 in (Square)", label: "12 × 12 in", short: "12 × 12 in", shape: "Square", w: 12, h: 12, description: "Large statement book for the coffee table. Mixes any photo shape." },
  { id: "8 x 8 in (Square)", label: "8 × 8 in", short: "8 × 8 in", shape: "Square", w: 8, h: 8, description: "Compact and affordable — ideal for gift copies for the whole family." },
];

export type StyleId = "Modern Classic" | "Heritage" | "Minimal" | "Travel Journal";

export interface StyleOption {
  id: StyleId;
  description: string;
  /** Linen cloth color and printed-cover accent for this style. */
  cloth: string;
  ink: string;
  paper: string;
}

export const STYLES: StyleOption[] = [
  { id: "Modern Classic", description: "Full-bleed cover photo with a clean serif title.", cloth: "#2f3238", ink: "#ffffff", paper: "#f7f4ef" },
  { id: "Heritage", description: "Cream title band, spaced capitals and timeless navy type.", cloth: "#22324d", ink: "#24324a", paper: "#f4efe7" },
  { id: "Minimal", description: "White space, a single framed photo and quiet sans-serif type.", cloth: "#d9d0c1", ink: "#2a2a2a", paper: "#fbfaf8" },
  { id: "Travel Journal", description: "Kraft label, handwritten title and a scrapbook feel.", cloth: "#3d5a45", ink: "#3b2f22", paper: "#efe6d6" },
];

export const DEFAULT_COVER: CoverId = "hardcover";
export const DEFAULT_SIZE = SIZES[0].id;
export const DEFAULT_STYLE: StyleId = "Modern Classic";

export const coverOf = (id?: string) => COVERS.find((c) => c.id === id) ?? COVERS.find((c) => c.id === DEFAULT_COVER)!;
export const sizeOf = (id?: string) => SIZES.find((s) => s.id === id) ?? SIZES[0];
export const styleOf = (id?: string) => STYLES.find((s) => s.id === id) ?? STYLES[0];
