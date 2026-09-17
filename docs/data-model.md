# Data model

| Table               | Purpose                                              | Relationships                               |
| ------------------- | ---------------------------------------------------- | ------------------------------------------- |
| demo_workspaces     | Hashed bearer session, creation and expiry           | Parent for all presenter-owned data         |
| organisations       | Business name, sector, region and size               | Workspace; one assessment in this prototype |
| assessments         | Stage, structured inputs, creation and update times  | Organisation and workspace                  |
| financial_scenarios | Base, upside, downside, score snapshots and revision | Assessment; unique name per assessment      |
| evidence_items      | Synthetic evidence description, category and quality | Assessment                                  |
| audit_events        | Actor, action, reason and timestamp                  | Workspace and optional assessment           |

Inputs and score components use typed JSONB because the prototype methodology is evolving. Business ownership, scenario ownership and audit relationships use foreign keys. Indexes support workspace/sector, workspace/stage, evidence and chronological audit queries. Financial assumptions are finite validated numbers; monetary outputs use rounded GBP values. This is decision support, not an accounting ledger.

On reset only the current workspace's organisations are deleted. Foreign-key cascades remove their assessments, scenarios and evidence. Audit events remain and their deleted assessment references become null. A new audit event records the reset.

`drizzle/` contains generated migration SQL and metadata. The first migration was applied to the new Circa database using the connected Neon transaction tool because local database DNS is unavailable. Its exact generated hash and timestamp were recorded in Drizzle's migration ledger. No hand-edited schema drift was introduced.
