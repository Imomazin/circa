import type { Adapter, ConnectorConfig, PullResult, RunMode } from "../framework";
import { enterpriseOrgs } from "@/domain/enterprise/generate";

/**
 * Companies House adapter.
 *
 * Live contract: GET https://api.company-information.service.gov.uk
 *   /company/{companyNumber}  (HTTP Basic auth with an API key).
 * In the demonstrator this runs in DEMO mode and returns the verified identity
 * already attached to each enterprise organisation — no network call is made.
 */

export interface CompanyProfile {
  company_number: string;
  company_name: string;
  company_status: string;
  type: string;
  sic_codes: string[];
  registered_office_address: { locality: string; country: string };
  date_of_creation: string;
}

const PAGE = 20;

export const companiesHouseConfig: ConnectorConfig = {
  auth: "API key",
  credentials: ["COMPANIES_HOUSE_API_KEY"],
  baseUrl: "https://api.company-information.service.gov.uk",
  rateLimit: { requestsPerMinute: 600, burst: 50 },
  retry: { maxAttempts: 4, backoff: "exponential", deadLetter: true },
  schedule: { cron: "0 3 * * *", mode: "incremental" },
  mapping: {
    company_number: "companyNumber",
    company_name: "name",
    company_status: "status",
    sic_codes: "sic",
    "registered_office_address.locality": "region",
    date_of_creation: "incorporated",
  },
};

export const companiesHouseAdapter: Adapter<CompanyProfile> = {
  id: "companies-house",
  config: companiesHouseConfig,
  describe() {
    return { id: this.id, auth: this.config.auth, objects: ["company profile"], mode: "demo" };
  },
  healthcheck(mode: RunMode) {
    if (mode === "demo") return { ok: true, mode, detail: "Serving verified identities from the demonstrator dataset." };
    const hasKey = typeof process !== "undefined" && !!process.env.COMPANIES_HOUSE_API_KEY;
    return hasKey
      ? { ok: true, mode, detail: "API key present." }
      : { ok: false, mode, detail: "Set COMPANIES_HOUSE_API_KEY to connect." };
  },
  pull(object: string, mode: RunMode, cursor?: string | null): PullResult<CompanyProfile> {
    const start = cursor ? parseInt(cursor, 10) : 0;
    const orgs = enterpriseOrgs().filter((o) => o.verified).slice(start, start + PAGE);
    const records: CompanyProfile[] = orgs.map((o) => ({
      company_number: o.companyNumber,
      company_name: o.name,
      company_status: o.status,
      type: "ltd",
      sic_codes: o.sic,
      registered_office_address: { locality: o.region, country: "Scotland" },
      date_of_creation: `${o.incorporated}-01-01`,
    }));
    const next = orgs.length === PAGE ? String(start + PAGE) : null;
    return {
      object,
      mode,
      records,
      cursor: next,
      event: { connectorId: this.id, object, records: records.length, at: Date.now(), status: "ok" },
    };
  },
};
