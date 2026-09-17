# Security

## Implemented

- Database connection strings remain in server environment variables.
- Browser sessions use 256-bit random tokens, hashed in PostgreSQL and stored in HttpOnly, SameSite=Lax cookies. HTTPS cookies are Secure.
- Each data operation resolves workspace ownership server-side. A record identifier alone grants no access.
- JSON mutation routes require a matching Origin and application/json content type, with a 24 KB body limit.
- Zod validates bounded finite financial values and enumerated selections.
- Drizzle parameterises application queries. Foreign keys enforce record relationships.
- Scenario updates use a transaction and optimistic revision checking.
- Error responses omit stack traces and server logs omit request bodies and credentials.
- Security headers restrict framing, MIME sniffing, camera, microphone and geolocation.
- Demo reset requires the exact confirmation string and only resets the requesting workspace.

## Limits

This is a synthetic-data demonstrator. The public demo entry is not enterprise authentication. Formal RBAC, administrator identity, persistent rate limits, automated expiry cleanup, complete CSP nonces, penetration testing and production operational monitoring remain future work. No real personal or confidential business data should be entered.

Preview deployment protection should remain enabled where the account provides it. Do not weaken protection for convenience. Only Preview receives the demo database variables. Main is not merged or promoted.

## Public repository check

Before pushing, inspect staged files for credentials, private information and commercial agreement terms. Variable names, schema terminology and localhost-only CI connection examples are expected. Actual hosted URLs containing credentials must never be committed.
