import type { MaterialFamily } from "@/domain/network/types";

/**
 * Curated vocabularies for the enterprise dataset. Everything an organisation,
 * stream or opportunity is built from is drawn from these lists so the
 * generated network reads as a believable Scottish circular economy.
 */

export interface MaterialClass {
  id: string;
  label: string;
  family: MaterialFamily;
  /** Indicative recovered value, £/tonne. */
  valuePerTonne: number;
  /** Indicative avoided disposal, £/tonne. */
  disposalPerTonne: number;
  /** Indicative avoided embodied carbon, tCO2e per tonne recirculated. */
  carbonPerTonne: number;
  /** Indicative processing/reconditioning cost, £/tonne. */
  processingPerTonne: number;
}

export const MATERIAL_CLASSES: MaterialClass[] = [
  { id: "timber-board", label: "Reclaimed board & panel", family: "Timber & board", valuePerTonne: 240, disposalPerTonne: 110, carbonPerTonne: 0.9, processingPerTonne: 55 },
  { id: "structural-timber", label: "Structural timber", family: "Timber & board", valuePerTonne: 310, disposalPerTonne: 115, carbonPerTonne: 1.1, processingPerTonne: 48 },
  { id: "pallets-crates", label: "Pallets & crates", family: "Timber & board", valuePerTonne: 180, disposalPerTonne: 90, carbonPerTonne: 0.8, processingPerTonne: 30 },
  { id: "wool-fibre", label: "Reclaimed wool fibre", family: "Textiles & fibre", valuePerTonne: 950, disposalPerTonne: 180, carbonPerTonne: 15, processingPerTonne: 220 },
  { id: "mixed-textile", label: "Mixed textile offcuts", family: "Textiles & fibre", valuePerTonne: 540, disposalPerTonne: 160, carbonPerTonne: 11, processingPerTonne: 180 },
  { id: "technical-textile", label: "Technical textiles", family: "Textiles & fibre", valuePerTonne: 1250, disposalPerTonne: 210, carbonPerTonne: 18, processingPerTonne: 260 },
  { id: "alloy-castings", label: "Alloy bar & castings", family: "Metals & alloys", valuePerTonne: 1450, disposalPerTonne: 95, carbonPerTonne: 3.3, processingPerTonne: 140 },
  { id: "structural-steel", label: "Structural & subsea steel", family: "Metals & alloys", valuePerTonne: 420, disposalPerTonne: 85, carbonPerTonne: 2.6, processingPerTonne: 90 },
  { id: "aluminium-extrusion", label: "Aluminium extrusion", family: "Metals & alloys", valuePerTonne: 1620, disposalPerTonne: 100, carbonPerTonne: 8.1, processingPerTonne: 160 },
  { id: "copper-cable", label: "Copper & cable", family: "Metals & alloys", valuePerTonne: 5200, disposalPerTonne: 120, carbonPerTonne: 4.2, processingPerTonne: 180 },
  { id: "rigid-polymer", label: "Rigid polymer (rPET/rPP)", family: "Polymers & plastics", valuePerTonne: 620, disposalPerTonne: 165, carbonPerTonne: 2.1, processingPerTonne: 150 },
  { id: "film-polymer", label: "Polymer film & flexible", family: "Polymers & plastics", valuePerTonne: 380, disposalPerTonne: 175, carbonPerTonne: 2.4, processingPerTonne: 170 },
  { id: "engineering-polymer", label: "Engineering polymer", family: "Polymers & plastics", valuePerTonne: 980, disposalPerTonne: 180, carbonPerTonne: 3.0, processingPerTonne: 210 },
  { id: "pcb-modules", label: "Boards & modules", family: "Electronics & components", valuePerTonne: 3800, disposalPerTonne: 240, carbonPerTonne: 21, processingPerTonne: 520 },
  { id: "appliance-components", label: "Appliance components", family: "Electronics & components", valuePerTonne: 2600, disposalPerTonne: 230, carbonPerTonne: 17, processingPerTonne: 430 },
  { id: "batteries-cells", label: "Battery cells & packs", family: "Electronics & components", valuePerTonne: 4200, disposalPerTonne: 320, carbonPerTonne: 24, processingPerTonne: 610 },
  { id: "spent-grain", label: "Spent grain & pomace", family: "Food & organic", valuePerTonne: 60, disposalPerTonne: 85, carbonPerTonne: 0.8, processingPerTonne: 28 },
  { id: "food-byproduct", label: "Food processing by-product", family: "Food & organic", valuePerTonne: 95, disposalPerTonne: 95, carbonPerTonne: 1.1, processingPerTonne: 35 },
  { id: "used-cooking-oil", label: "Used cooking oil & fats", family: "Food & organic", valuePerTonne: 520, disposalPerTonne: 70, carbonPerTonne: 2.5, processingPerTonne: 60 },
  { id: "glass-cullet", label: "Glass cullet", family: "Glass & packaging", valuePerTonne: 90, disposalPerTonne: 65, carbonPerTonne: 0.5, processingPerTonne: 22 },
  { id: "fibre-packaging", label: "Fibre & corrugate packaging", family: "Glass & packaging", valuePerTonne: 150, disposalPerTonne: 70, carbonPerTonne: 0.7, processingPerTonne: 25 },
  { id: "plant-assets", label: "Plant & equipment", family: "Equipment & assets", valuePerTonne: 1900, disposalPerTonne: 130, carbonPerTonne: 3.6, processingPerTonne: 240 },
  { id: "marine-equipment", label: "Marine & subsea assets", family: "Equipment & assets", valuePerTonne: 2200, disposalPerTonne: 140, carbonPerTonne: 3.9, processingPerTonne: 280 },
  { id: "tools-fixtures", label: "Tools & fixtures", family: "Equipment & assets", valuePerTonne: 1250, disposalPerTonne: 120, carbonPerTonne: 3.1, processingPerTonne: 200 },
];

export interface SectorDef {
  name: string;
  sicPrefix: string;
  /** Material classes this sector tends to supply / demand. */
  classes: string[];
}

export const SECTOR_DEFS: SectorDef[] = [
  { name: "Manufacturing", sicPrefix: "25", classes: ["alloy-castings", "structural-steel", "aluminium-extrusion", "engineering-polymer", "tools-fixtures"] },
  { name: "Construction", sicPrefix: "41", classes: ["structural-timber", "timber-board", "structural-steel", "copper-cable", "glass-cullet"] },
  { name: "Food & Drink", sicPrefix: "10", classes: ["spent-grain", "food-byproduct", "used-cooking-oil", "glass-cullet", "fibre-packaging"] },
  { name: "Textiles", sicPrefix: "13", classes: ["wool-fibre", "mixed-textile", "technical-textile"] },
  { name: "Electronics", sicPrefix: "26", classes: ["pcb-modules", "appliance-components", "batteries-cells", "copper-cable"] },
  { name: "Furniture", sicPrefix: "31", classes: ["timber-board", "structural-timber", "rigid-polymer", "mixed-textile"] },
  { name: "Equipment Rental", sicPrefix: "77", classes: ["plant-assets", "tools-fixtures", "marine-equipment"] },
  { name: "Consumer Goods", sicPrefix: "47", classes: ["appliance-components", "rigid-polymer", "film-polymer", "fibre-packaging"] },
  { name: "Packaging", sicPrefix: "17", classes: ["rigid-polymer", "film-polymer", "fibre-packaging", "glass-cullet"] },
  { name: "Industrial Services", sicPrefix: "38", classes: ["structural-steel", "marine-equipment", "plant-assets", "copper-cable"] },
  { name: "Energy & Utilities", sicPrefix: "35", classes: ["copper-cable", "structural-steel", "batteries-cells", "plant-assets"] },
  { name: "Public Sector", sicPrefix: "84", classes: ["fibre-packaging", "appliance-components", "tools-fixtures", "timber-board"] },
  { name: "Transport & Logistics", sicPrefix: "49", classes: ["pallets-crates", "tools-fixtures", "film-polymer", "plant-assets"] },
  { name: "Agriculture", sicPrefix: "01", classes: ["food-byproduct", "spent-grain", "film-polymer", "pallets-crates"] },
];

export interface RegionDef {
  name: string;
  lat: number;
  lng: number;
}

export const REGION_DEFS: RegionDef[] = [
  { name: "Glasgow", lat: 55.861, lng: -4.25 },
  { name: "Edinburgh", lat: 55.953, lng: -3.188 },
  { name: "Aberdeen", lat: 57.149, lng: -2.094 },
  { name: "Dundee", lat: 56.462, lng: -2.97 },
  { name: "Inverness", lat: 57.478, lng: -4.224 },
  { name: "Perth", lat: 56.397, lng: -3.437 },
  { name: "Stirling", lat: 56.117, lng: -3.937 },
  { name: "Falkirk", lat: 56.001, lng: -3.783 },
  { name: "Livingston", lat: 55.883, lng: -3.523 },
  { name: "Paisley", lat: 55.846, lng: -4.424 },
  { name: "East Kilbride", lat: 55.764, lng: -4.177 },
  { name: "Kirkcaldy", lat: 56.113, lng: -3.161 },
  { name: "Galashiels", lat: 55.617, lng: -2.807 },
  { name: "Fort William", lat: 56.819, lng: -5.105 },
  { name: "Dumfries", lat: 55.07, lng: -3.605 },
  { name: "Ayr", lat: 55.458, lng: -4.629 },
  { name: "Elgin", lat: 57.653, lng: -3.315 },
  { name: "Grangemouth", lat: 56.011, lng: -3.728 },
];

export const NAME_PREFIXES = [
  "Caledon", "Clyde", "Forth", "Tay", "Dee", "Spey", "Lomond", "Grampian", "Lothian", "Borders",
  "Highland", "Moray", "Ochil", "Pentland", "Cairngorm", "Solway", "Kelvin", "Nevis", "Argyll",
  "Angus", "Fife", "Tweed", "Esk", "Carron", "Garnock", "Almond", "Leven", "Ythan", "Don", "Nith",
];
export const NAME_ROOTS = [
  "Circular", "Resource", "Materials", "Reclaim", "Renew", "Loop", "Reform", "Remake", "Revive",
  "Second Life", "Cascade", "Salvage", "Recover", "Remanufacture", "Union", "Works", "Industries",
];
export const NAME_SUFFIXES = [
  "Ltd", "Group", "Co", "Partners", "Scotland", "Works", "Services", "Manufacturing", "Logistics",
  "Mill", "Foundry", "Fabrication", "Collective", "Exchange",
];

export const OWNERS = [
  "A. Fraser", "R. Mensah", "K. Lin", "S. Doyle", "J. Okafor", "M. Reid", "P. Nair", "L. Buchanan",
  "C. Adeyemi", "H. Sinclair",
];

export const COMPANY_STATUSES = ["Active", "Active", "Active", "Active", "Active - proposal to strike off"] as const;
export const COMPANY_SIZES = ["Micro (1-9)", "Small (10-49)", "Medium (50-249)", "Large (250+)"] as const;
