import { BUSINESSES } from "../../db/seed-data";
import { MATERIAL_STREAMS } from "../network/data";
import type { MaterialFamily, MaterialStream, QualityGrade } from "../network/types";
import { Rng, hashStr } from "./prng";
import {
  MATERIAL_CLASSES,
  SECTOR_DEFS,
  REGION_DEFS,
  NAME_PREFIXES,
  NAME_ROOTS,
  NAME_SUFFIXES,
  OWNERS,
  COMPANY_STATUSES,
  COMPANY_SIZES,
  type MaterialClass,
} from "./vocab";
import type { EnterpriseOrg } from "./types";

/**
 * Deterministic enterprise-network generator.
 *
 * Produces a large, relationally coherent Scottish circular-economy network:
 * ~160 organisations (the 12 curated "featured" businesses plus a generated
 * wider network), each with a verified identity, material supply/demand
 * streams tied to the connectors that would source them, and a procurement
 * profile. Everything derives from a fixed seed, so it is reproducible.
 */

const TARGET_ORGS = 160;
const ERP_SOURCES = ["sap-s4hana", "dynamics-365", "oracle-fusion"];
const PROCUREMENT_SOURCES = ["coupa", "sap-ariba", "jaggaer", "ivalua"];

export const MATERIAL_CLASS_BY_ID = new Map(MATERIAL_CLASSES.map((c) => [c.id, c]));

const FATES: Record<MaterialFamily, string[]> = {
  "Timber & board": ["Chipped on site", "Landfilled at end of contract", "Low-value biomass"],
  "Textiles & fibre": ["Baled for export", "Mixed textile waste to RDF", "Incinerated"],
  "Metals & alloys": ["Sold as mixed scrap", "Exported to merchant", "Downcycled"],
  "Polymers & plastics": ["Baled for recycler", "Shredded to landfill", "Energy from waste"],
  "Electronics & components": ["WEEE recycler", "Shredded for recovery", "Stored pending disposal"],
  "Food & organic": ["Low-value animal feed", "Anaerobic digestion", "Disposed to sewer"],
  "Glass & packaging": ["Materials recovery facility", "Mixed recycling", "Landfilled"],
  "Equipment & assets": ["Auctioned at end of life", "Scrapped", "Stored unused"],
};
const SPECS: Record<MaterialFamily, string[]> = {
  "Timber & board": ["Nail-free, strength-graded", "De-laminated board ≥18mm", "FSC where available"],
  "Textiles & fibre": ["Single-fibre, baled", "Wool-rich, ≤10% synthetic", "Clean, carded"],
  "Metals & alloys": ["Segregated alloy, certified grade", "Mill-test certificate", "Sorted by alloy"],
  "Polymers & plastics": ["Sorted by polymer, clean", "Food-grade where stated", "≤5% contamination"],
  "Electronics & components": ["Tested, documented", "Working modules, graded", "Traceable provenance"],
  "Food & organic": ["Food-safe, cold-chain", "Consistent moisture content", "Batch-traceable"],
  "Glass & packaging": ["Colour-sorted", "Food-safe recycled", "Baled, contaminant-free"],
  "Equipment & assets": ["Repairable, service history", "Refurbishment-grade", "Spares recoverable"],
};

const GRADES: QualityGrade[] = ["A", "B", "C"];

function companyNumber(seed: string): string {
  return "SC" + String(100000 + (hashStr(seed) % 899999)).padStart(6, "0");
}

function sicFor(rng: Rng, sector: string): string[] {
  const def = SECTOR_DEFS.find((s) => s.name === sector) ?? SECTOR_DEFS[0];
  const n = rng.int(1, 3);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(def.sicPrefix + String(rng.int(100, 999)));
  return [...new Set(out)];
}

function featuredOrgs(): EnterpriseOrg[] {
  return BUSINESSES.map((b) => {
    const rng = new Rng(hashStr(b.id));
    const region = REGION_DEFS.find((r) => r.name === b.region) ?? REGION_DEFS[0];
    return {
      id: b.id,
      name: b.name,
      companyNumber: companyNumber(b.id),
      sector: b.sector,
      sic: sicFor(rng, b.sector),
      status: "Active",
      region: b.region,
      lat: region.lat,
      lng: region.lng,
      size: b.companySize,
      incorporated: rng.int(1998, 2019),
      featured: true,
      verified: true,
      owner: OWNERS[hashStr(b.id) % OWNERS.length],
      procurementSpend: rng.step(rng.range(1_200_000, 9_000_000), 50_000),
      procurementCategories: rng.sample(SECTOR_DEFS.find((s) => s.name === b.sector)?.classes ?? [], 3).map(classLabel),
    } satisfies EnterpriseOrg;
  });
}

function classLabel(id: string): string {
  return MATERIAL_CLASS_BY_ID.get(id)?.label ?? id;
}

function generateOrgs(): EnterpriseOrg[] {
  const rng = new Rng(20260601);
  const featured = featuredOrgs();
  const used = new Set(featured.map((o) => o.name.toLowerCase()));
  const orgs: EnterpriseOrg[] = [...featured];

  let guard = 0;
  while (orgs.length < TARGET_ORGS && guard < TARGET_ORGS * 40) {
    guard++;
    const prefix = rng.pick(NAME_PREFIXES);
    const root = rng.pick(NAME_ROOTS);
    const useSuffix = rng.chance(0.8);
    const suffix = useSuffix ? rng.pick(NAME_SUFFIXES) : "";
    const name = `${prefix} ${root}${suffix ? " " + suffix : ""}`.trim();
    if (used.has(name.toLowerCase())) continue;
    used.add(name.toLowerCase());

    const sector = rng.pick(SECTOR_DEFS).name;
    const region = rng.pick(REGION_DEFS);
    const id = slug(name);
    const latJ = region.lat + rng.range(-0.05, 0.05);
    const lngJ = region.lng + rng.range(-0.05, 0.05);
    orgs.push({
      id,
      name,
      companyNumber: companyNumber(id),
      sector,
      sic: sicFor(rng, sector),
      status: rng.pick(COMPANY_STATUSES),
      region: region.name,
      lat: Math.round(latJ * 1000) / 1000,
      lng: Math.round(lngJ * 1000) / 1000,
      size: rng.pick(COMPANY_SIZES),
      incorporated: rng.int(1992, 2023),
      featured: false,
      verified: rng.chance(0.82),
      owner: rng.pick(OWNERS),
      procurementSpend: rng.step(rng.range(300_000, 14_000_000), 50_000),
      procurementCategories: rng
        .sample(SECTOR_DEFS.find((s) => s.name === sector)?.classes ?? [], rng.int(2, 3))
        .map(classLabel),
    });
  }
  return orgs;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function volumeFor(rng: Rng, cls: MaterialClass): number {
  // Heavier materials move in larger tonnages; high-value electronics in small.
  const base =
    cls.family === "Food & organic"
      ? rng.range(200, 1600)
      : cls.family === "Electronics & components"
        ? rng.range(12, 90)
        : cls.family === "Textiles & fibre"
          ? rng.range(30, 220)
          : rng.range(80, 720);
  return Math.round(base);
}

function generateStreams(orgs: EnterpriseOrg[]): MaterialStream[] {
  const streams: MaterialStream[] = [...MATERIAL_STREAMS]; // authored featured streams
  const featuredIds = new Set(BUSINESSES.map((b) => b.id));
  const rng = new Rng(74015);

  for (const org of orgs) {
    if (featuredIds.has(org.id)) continue; // keep curated streams for featured
    const def = SECTOR_DEFS.find((s) => s.name === org.sector);
    if (!def) continue;
    const classes = def.classes.map((id) => MATERIAL_CLASS_BY_ID.get(id)!).filter(Boolean);

    const nSupply = rng.int(0, 3);
    const nDemand = rng.int(0, 2);
    const supplyClasses = rng.sample(classes, nSupply);
    const demandClasses = rng.sample(classes, nDemand);

    supplyClasses.forEach((cls, i) => {
      const grade = rng.pick(GRADES);
      streams.push({
        id: `${org.id}-s${i}`,
        orgId: org.id,
        direction: "supply",
        family: cls.family,
        material: cls.label,
        classId: cls.id,
        annualVolumeTonnes: volumeFor(rng, cls),
        valuePerTonne: Math.round(cls.valuePerTonne * rng.range(0.85, 1.15)),
        readiness: rng.int(44, 82),
        grade,
        currentFate: rng.pick(FATES[cls.family]),
        sourceConnector: rng.pick(ERP_SOURCES),
      });
    });
    demandClasses.forEach((cls, i) => {
      streams.push({
        id: `${org.id}-d${i}`,
        orgId: org.id,
        direction: "demand",
        family: cls.family,
        material: cls.label,
        classId: cls.id,
        annualVolumeTonnes: volumeFor(rng, cls),
        valuePerTonne: Math.round(cls.valuePerTonne * rng.range(0.9, 1.2)),
        readiness: rng.int(46, 84),
        minGrade: rng.pick(GRADES),
        specNeeded: rng.pick(SPECS[cls.family]),
        sourceConnector: rng.pick(PROCUREMENT_SOURCES),
      });
    });
  }
  return streams;
}

let _orgs: EnterpriseOrg[] | null = null;
let _streams: MaterialStream[] | null = null;

export function enterpriseOrgs(): EnterpriseOrg[] {
  if (!_orgs) _orgs = generateOrgs();
  return _orgs;
}
export function enterpriseStreams(): MaterialStream[] {
  if (!_streams) _streams = generateStreams(enterpriseOrgs());
  return _streams;
}

let _orgMap: Map<string, EnterpriseOrg> | null = null;
export function orgById(id: string): EnterpriseOrg | undefined {
  if (!_orgMap) _orgMap = new Map(enterpriseOrgs().map((o) => [o.id, o]));
  return _orgMap.get(id);
}
