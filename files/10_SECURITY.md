---
purpose: Security — threat model, injection/auth/transport/edge controls, secrets, DPDP, vulnerability SLA
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [04_DATA_MODEL.md, 07_API_CONTRACT.md, 09_ERROR_HANDLING.md, 12_GITHUB_ACTIONS.md, 13_TESTING.md]
---

# 10 — Security

## 1. Threat model (STRIDE-lite)

| Asset | Threat | Control | Residual risk |
|---|---|---|---|
| Patient lead data | Information disclosure | AES-256-GCM columns, RLS, access logs | Insider misuse (low) |
| Tenant isolation | Elevation/tampering | RLS + RBAC + isolation tests | Policy bug (low, tested) |
| Auth sessions | Spoofing | OTP limits, rotating refresh, reuse detection | Phished inbox |
| Payments | Tampering/repudiation | HMAC webhooks, reconciliation, audit_log | Provider outage |
| Client site | Defacement | Static files, R2 write only by pipeline, CSP | Account takeover (Cloudflare 2FA) |
| Lead API | DoS/spam | Rate limits, honeypot, WAF | Distributed bots (medium) |
| Secrets | Disclosure | Vercel env, gitleaks, rotation | Developer machine (medium) |
| Domains | Hijack | Registrar lock, 2FA, expiry sweep | Registrar error |

## 2. Injection & client attacks

**(SD-042) SQL injection.** *Meaning:* untrusted input reaching SQL. *Decision:* Drizzle typed queries and parameterized `sql` template only; ESLint rule `no-restricted-syntax` bans string-built SQL and `db.execute(` with concatenation; example allowed: `db.select().from(leads).where(eq(leads.tenantId, id))`. Rejected: raw SQL strings. *Failure:* data exfiltration; reveals as WAF SQLi rule hits and CI lint failure. *Verify:* 13 § 1 (injection payload tests); 12 § 2.

**(SD-043) XSS.** *Meaning:* script injection through content. *Decision:* React escaping by default; JSON-LD via `JSON.stringify` then escaping `<` as `\u003c`; `dangerouslySetInnerHTML` banned except allowlisted markdown through `sanitize-html` strict config (no scripts, no inline handlers); CSP per client site: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://www.google.com/maps; connect-src https://api.doctorsite.in; base-uri 'none'; form-action 'self'`; portal CSP uses nonces. *Failure:* stored XSS in doctor content; reveals as CSP report-uri events. *Verify:* 13 § 3 (garbage content), 13 § 7.

**(SD-044) CSRF.** *Meaning:* cross-site mutations. *Decision:* `SameSite=Lax` cookies; double-submit `X-CSRF-Token` header on every portal mutation; Server Actions verify `Origin` equals `https://app.doctorsite.in`. Public lead POST has no cookies (no CSRF surface) and uses CORS allowlist plus honeypot. *Failure:* forged state change; reveals as origin-reject counter. *Verify:* 13 § 1.

## 3. Server-side request & auth attacks

**(SD-045) SSRF.** *Meaning:* server fetching attacker URLs. *Decision:* platform never fetches user-supplied URLs; Google Maps URL is validated by regex to `https://www.google.com/maps/…` and only embedded client-side; in P2 any asset fetch/webhook target goes through an egress allowlist with 5 MB / 5 s caps and private-IP blocking. Rejected: open fetch. *Failure:* metadata/internal access; reveals as blocked-egress logs. *Verify:* 13 § 1.

**(SD-046) OAuth.** *Meaning:* Google sign-in (P2). *Decision:* authorization-code flow with PKCE (S256), random `state` and `nonce` bound to a short-lived cookie, ID token verified (iss, aud, exp, nonce), link accounts only on `email_verified=true` and matching existing user; never auto-merge staff roles. *Failure:* account takeover; reveals as `oauth_state_mismatch_total`. *Verify:* 13 § 2.

**(SD-047) JWT rotation.** *Meaning:* token lifecycle. *Decision:* access JWT 15 min (ES256), refresh 30 days stored hashed in `refresh_tokens(family_id)`; each use rotates; reuse of a retired token revokes the family and forces login; "logout all devices" revokes all families; signing keys rotate every 90 days with `kid` overlap of 24 h. *Failure:* stolen token persistence; reveals as `refresh_reuse_total` (Sev-2). *Verify:* 13 § 1.

## 4. Identity & access

**(SD-048) IAM.** *Meaning:* who may do what.

| Resource | superadmin | operator | tenant_owner | tenant_staff |
|---|---|---|---|---|
| Tenants (all) | CRUD | Read/Create | Own read | none |
| Site content | Edit | Edit | Edit own | Edit own |
| Publish/rollback | Yes | Yes | Publish own | none |
| Leads | Read all | Read assigned | Read own | Read own |
| Billing | All | Read | Own | none |
| Feature flags, audit_log | Yes | Read | none | none |

RLS backstop: policies on every tenant table; application DB role has no `BYPASSRLS`; operator access uses a separate role. Review: quarterly access review (14 § 5). *Failure:* privilege escalation; reveals as denied-action audit entries and isolation test failures. *Verify:* 13 § 1.

**(SD-018) CORS.** *Meaning:* which origins may call the API from browsers. *Decision:* `Access-Control-Allow-Origin` echoes only origins found in `domains.host` (cached 60 s) plus portal/preview origins; `Allow-Credentials` false for the public lead endpoint, true only for portal origin; methods `POST, OPTIONS`; `Vary: Origin`; wildcard `*` banned. *Failure:* spam from arbitrary sites or blocked legit sites; reveals as CORS-reject metric. *Verify:* 13 § 1.

## 5. Transport & data protection

**(SD-049) TLS.** *Meaning:* HTTPS everywhere. *Decision:* Cloudflare SSL mode Full (strict), min TLS 1.2, TLS 1.3 on, HSTS `max-age=31536000; includeSubDomains` (preload after 6 months), Automatic HTTPS Rewrites; client-domain certificates automated by SSL for SaaS (DCV via CNAME). *Failure:* expired cert; reveals as SSL-status poll and probe failure. *Verify:* 14 § 1.

**(SD-050) Encryption at rest.** *Meaning:* stored data protection. *Decision:* host disk encryption plus application-level AES-256-GCM on `leads.*_enc` (12-byte random IV per value; key `PII_KEY_V1` in Vercel env; key id stored beside ciphertext for rotation); no PII in logs. Rejected: pgcrypto in SQL (keys visible to DB logs). *Sketch:* `encrypt(plain, key) → iv|tag|ciphertext`. *Failure:* plaintext leak; reveals via DB dump review and scrubber tests. *Verify:* 13 § 1; 14 § 5.

**(SD-051) Encryption in transit.** *Meaning:* TLS on each hop. *Decision:* browser↔Cloudflare↔Vercel TLS; app↔Postgres `sslmode=verify-full`; app↔Upstash HTTPS; renderer↔R2/API HTTPS; webhooks HTTPS only. *Failure:* downgrade/plaintext; reveals in connection-string lint check. *Verify:* 12 § 2.

## 6. Edge protection

**(SD-052) WAF.** *Meaning:* request filtering. *Decision:* Cloudflare managed OWASP Core Ruleset on `api.doctorsite.in` (sensitivity medium; high on `/v1/auth/*`), log-only for first 7 days of any rule change, then block; false positives handled by per-rule exceptions on `/v1/leads` body fields (documented). Rejected: custom rules first. *Failure:* blocked real patients; reveals as 403 rate for leads and Sev-3 alert. *Verify:* 13 § 7; 14 § 3.

**(SD-053) DDoS protection.** *Meaning:* volumetric attacks. *Decision:* Cloudflare free-tier always-on L3/L4 and rate-limit rules; static sites absorb attack traffic at the CDN; upgrade to Pro (≈ ₹1,800/mo, estimate) after the first attack causing > 15 min degradation. *Failure:* API saturation; reveals as request-rate anomaly alerts. *Verify:* 13 § 5; 14 § 4.

**(SD-002) Rate limiting.** *Meaning:* per-actor request caps. *Decision:* Upstash `@upstash/ratelimit` sliding window: public form 5/min/IP, leads API 100/h/tenant, auth endpoints 10/15 min/IP, portal reads 300/min/user; 429 contract in 07 § 7. Redis down: fail-open for reads, fail-closed for auth. *Failure:* spam flood or locked-out users; reveals as `rate_limit_hit_total`. *Verify:* 13 § 4; 13 § 5.

## 7. Secrets

**(SD-019) Secrets management.** *Meaning:* credentials handling. *Decision:* Vercel encrypted env vars per environment; GitHub environment secrets with OIDC where supported; none in repo or client bundles (only `NEXT_PUBLIC_*` allowed, reviewed); rotation calendar: Razorpay/Resend/Upstash keys every 180 days, JWT keys 90 days, PII key via versioned re-encrypt yearly; gitleaks in pre-commit and CI. Leaked-key playbook: revoke at provider, rotate, redeploy, review provider logs 30 days back, document in postmortem. *Failure:* leaked key; reveals as gitleaks alert or provider anomaly. *Verify:* 12 § 2; 14 § 5.

## 8. DPDP Act 2023 compliance

| Item | Control |
|---|---|
| Consent notice | Every lead form: plain-language notice + unchecked checkbox, stored `consent_at` |
| Purpose limitation | Lead data used only to contact the patient for the enquiry |
| Data minimization | Name + phone required; email/message optional; no medical details requested (form hint: "do not enter health information") |
| Retention & deletion | 24 months default; deletion workflow (04 § 8) |
| Breach notification | Detect → contain within 24 h → notify the Data Protection Board and affected persons as the law requires; template in 14 § 4 |
| Roles | Doctor is the data fiduciary for patient leads; EcoDigiTech acts as processor under a data-processing clause in the service terms |

DECISION-NEEDED: legal review of terms, retention and breach timelines. Recommendation: engage a lawyer before P2 launch; resolve in ADR.

## 9. Vulnerability SLA process

| Stage | Rule |
|---|---|
| Intake | Report via security@ mailbox or operator form; ticket created, clock starts |
| Triage | Severity within 24 h (Critical/High/Medium/Low) |
| Patch | Critical/High within 3 days, others within 7 days (SLA is 7 days max) |
| Deploy | Release pipeline (12 § 3); client sites rebuilt via rebuild-all with backpressure (06 § SD-040) |
| Client notice | Email/WhatsApp summary after fix |
| Automation | Weekly dependency audit (12 § SD-076); security tests in 13 § 1 |

Acceptance: 100% of reported vulnerabilities closed within 7 days; breach alert at day 5.
