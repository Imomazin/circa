import type { MaterialFamily } from "./types";

/**
 * Per-family indicative factors. Carbon factors are order-of-magnitude
 * indicative avoided-emission estimates (tonnes CO2e avoided per tonne kept in
 * circulation vs virgin/disposal), used for demonstrator analytics only — not
 * audited emission figures.
 */
export interface FamilyFactors {
  /** tonnes CO2e avoided per tonne recirculated. */
  carbonPerTonne: number;
  /** Indicative disposal cost avoided, £ per tonne. */
  disposalPerTonne: number;
  /** Chart / token colour. */
  color: string;
  /** One-line description of the circular logic. */
  note: string;
}

export const FAMILY_FACTORS: Record<MaterialFamily, FamilyFactors> = {
  "Timber & board": {
    carbonPerTonne: 0.9,
    disposalPerTonne: 110,
    color: "#185847",
    note: "Reclaimed timber and board displacing virgin fibre.",
  },
  "Textiles & fibre": {
    carbonPerTonne: 15,
    disposalPerTonne: 180,
    color: "#3b8f76",
    note: "Reclaimed wool and fibre remanufactured into new yarn.",
  },
  "Metals & alloys": {
    carbonPerTonne: 3.2,
    disposalPerTonne: 95,
    color: "#4a545d",
    note: "Alloy and steel recovered for remanufacture rather than melt.",
  },
  "Polymers & plastics": {
    carbonPerTonne: 2.1,
    disposalPerTonne: 165,
    color: "#b87333",
    note: "Closed-loop polymer recovery displacing virgin resin.",
  },
  "Electronics & components": {
    carbonPerTonne: 21,
    disposalPerTonne: 240,
    color: "#7a4a1f",
    note: "Harvested modules and components re-entering repair and refurbishment.",
  },
  "Food & organic": {
    carbonPerTonne: 0.8,
    disposalPerTonne: 85,
    color: "#6fb3a0",
    note: "Processing by-products converted to higher-value use.",
  },
  "Glass & packaging": {
    carbonPerTonne: 0.6,
    disposalPerTonne: 70,
    color: "#99a2aa",
    note: "Recovered packaging re-entering local supply loops.",
  },
  "Equipment & assets": {
    carbonPerTonne: 3.5,
    disposalPerTonne: 130,
    color: "#cc8c54",
    note: "Whole assets kept in service through reuse, repair and remanufacture.",
  },
};
