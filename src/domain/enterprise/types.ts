/** An organisation in the enterprise network. Featured organisations carry a
 *  full commercial assessment; the wider network carries verified identity and
 *  material position. */
export interface EnterpriseOrg {
  id: string;
  name: string;
  /** Companies House-style number (SC######). */
  companyNumber: string;
  sector: string;
  sic: string[];
  status: string;
  region: string;
  lat: number;
  lng: number;
  size: string;
  incorporated: number;
  /** Carries a full Circa assessment (the original curated set). */
  featured: boolean;
  /** Verified against the Companies House connector. */
  verified: boolean;
  owner: string;
  procurementSpend: number;
  procurementCategories: string[];
}
