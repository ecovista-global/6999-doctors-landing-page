---
purpose: CI/CD, containers, Kubernetes/Helm (P3), IaC, scheduled jobs, feature flags, environments
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [02_TRD.md, 03_ARCHITECTURE.md, 10_SECURITY.md, 13_TESTING.md, 14_PRODUCTION_CHECKLIST.md]
---

# 12 — GitHub Actions & Delivery

## 1. Branching & conventions

Trunk-based: short-lived branches off `main`, squash merge; Conventional Commits (`feat:`, `fix:`, `docs:`); PR template requires: linked microtask, docs touched, changelog line, rollback note. `CODEOWNERS`: `/apps/platform/src/db/ @founder-a`, `/brain/ @founder-a @founder-b`, `/infra/ @founder-b`. A `docs-touched` job fails PRs that change `apps/**` or `packages/**` without a `brain/16_CHANGELOG.md` diff.

## 2. PR pipeline

**(SD-066) Build caching.** *Meaning:* faster CI. *Decision:* `actions/setup-node` + `pnpm/action-setup` with pnpm store cache keyed on `pnpm-lock.yaml`; Turborepo remote cache (Vercel Remote Cache) for `build/lint/test/typecheck`; Docker layer cache via `type=gha`. Target: warm PR pipeline < 6 min. Rejected: no cache (≈ 12 min). *Failure:* slow feedback; reveals as workflow duration P95 > 10 min. *Verify:* 13 § 2.

```yaml
name: pr
on: pull_request
concurrency: { group: pr-${{ github.ref }}, cancel-in-progress: true }
jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, env: { POSTGRES_PASSWORD: ci }, ports: ['5432:5432'] }
      redis: { image: redis:7, ports: ['6379:6379'] }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run typecheck lint test build --cache-dir=.turbo
      - run: pnpm --filter site-template size-check   # fails > 170 KB gzipped
      - uses: gitleaks/gitleaks-action@v2
      - run: pnpm audit --prod --audit-level=high
      - run: pnpm exec playwright test --project=moto-g-4g tests/smoke  # against Vercel preview URL
```

**(SD-076) Dependency hell.** *Meaning:* conflicting/unsafe packages. *Decision:* `pnpm install --frozen-lockfile`, one lockfile, `pnpm.overrides` documented in `brain/17_DECISIONS.md` when used; Renovate weekly (Mon 06:00 IST) grouped PRs; max dependency age: no direct dependency older than 18 months without ADR; `pnpm audit` high+ blocks merge. Rejected: ad-hoc upgrades. *Failure:* known-CVE package ships; reveals as audit failure/Renovate PR age > 14 days. *Verify:* 13 § 2; 10 § 9.

## 3. Release pipeline

**(SD-065) CI/CD.** *Meaning:* automated delivery. *Decision:* on merge to `main`: test → build → Drizzle migrate (expand-only, gated by `production` environment reviewer) → Vercel deploy → smoke → canary flag 10% → 30-min watch → 100%.

```yaml
name: release
on: { push: { branches: [main] } }
jobs:
  release:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile && pnpm turbo run test build
      - run: pnpm --filter platform db:migrate   # expand-first; contract migrations need label `contract-approved`
      - run: pnpm dlx vercel deploy --prod --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
      - run: pnpm exec playwright test tests/smoke-prod
```

*Failure:* broken release; reveals as failed smoke and error-rate alert. *Verify:* 14 § 2.

Deployment strategy comparison:

| Strategy | Fit for this stack | Verdict |
|---|---|---|
| **(SD-070)** Blue-green | Vercel keeps previous deployments live; alias swap = blue-green | Emulated by Vercel aliases (no extra infra) |
| **(SD-071)** Canary | Flag cohort (10% of tenants) on new code paths | Chosen for risky features (P2) |
| **(SD-072)** Rolling | Kubernetes only | P3 |

Pick: Vercel instant rollback + feature-flag canary; Kubernetes rolling in P3 (rejected now: ops cost for 2 people).

**(SD-070) Blue-green deployment.** *Meaning:* two live environments. *Decision:* each Vercel deployment has an immutable URL; production alias moves only after smoke passes; old deployment retained 30 days. *Sketch:* `vercel alias set <new-url> app.doctorsite.in`. *Failure:* DB migration incompatible with old version blocks rollback; mitigated by expand-first rule. *Verify:* 14 § 2.

**(SD-071) Canary releases.** *Meaning:* partial exposure. *Decision:* flag `rollout_pct` hashes `tenant_id` into 100 buckets; stages 10% → 50% → 100%, 30 minutes each watching error rate, P99, Sentry new issues. *Failure:* exposure of all tenants to a bug; reveals as canary-cohort error delta > 2 pts. *Verify:* 14 § 2.

**(SD-072) Rolling deployments.** *Meaning:* replace pods gradually (P3). *Decision:* `maxSurge 25%, maxUnavailable 0`; readiness gates traffic (See § 4, § 6). *Failure:* mixed versions during rollout; compat rule: N and N-1 must work together. *Verify:* 13 § 6 (P3).

**(SD-073) Rollbacks.** *Meaning:* returning to a good version. *Decision:* automatic: error rate > 2% for 5 min, or P99 > 300 ms for 10 min, or Sentry new-issue spike (> 20 events/5 min) → pipeline runs `vercel rollback`; manual runbook: `vercel rollback`, disable flag, post incident note, never roll back a contract migration (roll forward). *Failure:* slow reaction; reveals as time-to-rollback metric (target < 10 min). *Verify:* 14 § 2; 13 § 6.

## 4. Health & probes

**(SD-074) Health checks.** *Meaning:* endpoints for monitors. *Decision:* `/api/health` liveness returns 200 `{status:"ok"}` if process responds (no dependency checks); `/api/ready` readiness checks Postgres `SELECT 1` (500 ms) and Redis `PING` (300 ms), returns 503 with failing component name; external probes call `/api/ready` every 5 min and client homepages every 5 min. *Failure:* false green; reveals as probe/real-traffic mismatch. *Verify:* 13 § 2; 14 § 3.

**(SD-075) Liveness & readiness probes.** *Meaning:* orchestrator-driven health. *Decision:* renderer Docker `HEALTHCHECK CMD node healthcheck.js` every 30 s; P3 K8s: `livenessProbe: httpGet /api/health period 10s failureThreshold 3`, `readinessProbe: httpGet /api/ready period 5s failureThreshold 2`, `startupProbe` 60 s. Rejected: using readiness as liveness (restart storms during DB outage). *Failure:* pod restart loops; reveals as restart count. *Verify:* 13 § 6; 14 § 3.

## 5. Containers

**(SD-061) Docker.** *Meaning:* images in CI from day 1. *Decision:* containerized: content renderer (`infra/docker/renderer.Dockerfile`: Node 22 slim + sharp + Chromium for Lighthouse) and Playwright runner; multi-stage (deps → build → runtime, non-root user, read-only FS); `hadolint` in CI; layer cache `type=gha`; image tag = git SHA; images pushed to GHCR. Platform itself ships via Vercel until P3. *Failure:* heavy image slows builds; reveals as renderer start time > 25 s. *Verify:* 13 § 2.

## 6. Kubernetes + Helm (P3, fully specified)

**(SD-062) Kubernetes.** *Meaning:* orchestrated deployment of platform + renderer (P3). *Decision:* adopt when Vercel + runner spend > ₹60,000/month or > 3,000 sites (02 § SD-086). Sketch:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: platform }
spec:
  replicas: 3
  strategy: { rollingUpdate: { maxSurge: 25%, maxUnavailable: 0 } }
  template:
    spec:
      containers:
        - name: platform
          image: ghcr.io/ecodigitech/platform:SHA
          resources: { requests: { cpu: 250m, memory: 512Mi }, limits: { memory: 1Gi } }
          readinessProbe: { httpGet: { path: /api/ready, port: 3000 }, periodSeconds: 5 }
          livenessProbe: { httpGet: { path: /api/health, port: 3000 }, periodSeconds: 10 }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec: { minReplicas: 3, maxReplicas: 12, metrics: [{ type: Resource, resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } } }] }
```

Rejected now: Kubernetes in P1/P2 (operational load). *Failure:* mis-sized requests cause evictions; reveals as OOMKilled events. *Verify:* 13 § 6; 14 § 5 (capacity review). HPA detail: 03 § SD-081.

**(SD-063) Helm charts.** *Meaning:* templated manifests. *Decision:* `infra/helm/doctorsite/` with `Chart.yaml`, `templates/{deployment,service,hpa,ingress}.yaml`, `values-{staging,prod}.yaml`; secrets via External Secrets Operator (no secrets in values); `helm lint` + `helm template` in CI. *Failure:* drift between environments; reveals as `helm diff` in PRs. *Verify:* 13 § 2.

## 7. Service discovery

**(SD-064) Service discovery.** *Meaning:* how components find each other. *Decision:* P1/P2: DNS names and env-var URLs (`DATABASE_URL`, `REDIS_URL`, `RENDERER_DISPATCH_URL`); P3: Kubernetes Services + CoreDNS (`platform.svc.cluster.local`). Consul/etcd rejected (no dynamic service mesh need). *Failure:* stale URL after migration; reveals as readiness failures. *Verify:* 14 § 2.

## 8. Infrastructure as code

**(SD-067) Infrastructure as code.** *Meaning:* reproducible infra. *Decision:* no console changes; every resource lives in `infra/terraform/`; emergency console edits must be back-ported within 24 h; audit via monthly `terraform plan` drift check. *Failure:* unrecoverable snowflake setup; reveals as drift plan non-empty. *Verify:* 14 § 5 (DR drill).

**(SD-068) Terraform.** *Meaning:* the IaC tool. *Decision:* modules: `postgres-host`, `upstash`, `cloudflare-zone` (DNS records, WAF rules, custom hostnames per client generated from the `domains` table export), `github` (branch protection, environments); remote state in R2-compatible backend with locking; `terraform plan` on PR, `apply` only on `main` via `production` environment approval. Rejected: Pulumi (team familiarity). *Failure:* state corruption; reveals as failed plan; state versioned daily. *Verify:* 14 § 5.

## 9. Scheduled jobs

**(SD-041) Cron jobs.** *Meaning:* recurring work; GitHub schedules for infra-ish jobs, pg-boss schedules for app jobs. *Decision:* all idempotent, all alert on failure (missing heartbeat).

| Job | Where | Schedule (IST) | Purpose |
|---|---|---|---|
| Domain-expiry sweep | pg-boss | Daily 06:00 | 06 § 4 |
| SSL status check | pg-boss | Daily 06:30 | Cert state |
| Uptime synthetics | External | Every 5 min | Availability |
| Backup verification | GitHub | Weekly Sun 03:00 | Restore test (14 § SD-097) |
| Dependency audit | GitHub | Weekly Mon 06:00 | 10 § 9 |
| Cost report | GitHub | Monthly 1st 07:00 | 02 § SD-086 |
| Partition creation | pg-boss | Monthly 25th | 04 § SD-029 |
| Chaos experiments | Manual GameDay | Quarterly | 13 § SD-099 |

*Failure:* silent missed run; reveals as heartbeat gap (Better Stack heartbeat, grace 2 h). *Verify:* 14 § 5.

## 10. Feature flags

**(SD-069) Feature flags.** *Meaning:* runtime switches. *Decision:* table `feature_flags` (key, default, owner, kill-switch) read through Redis `flag:{key}` (TTL 60 s, DB fallback); used for canary exposure; cleanup: no flag older than 90 days (weekly job lists violators).

| Key | Default | Owner | Kill-switch |
|---|---|---|---|
| `p2_signup` | off | Founder A | Yes |
| `whatsapp_cloud_notify` | off | Founder B | Yes |
| `google_oauth` | off | Founder A | Yes |
| `lead_outbox_fallback` | on | Founder B | No |

Rejected: LaunchDarkly (cost). *Failure:* stale flags accumulate; reveals as >90-day flag count. *Verify:* 14 § 2.

## 11. Environments & secrets

GitHub environments: `preview` (no approval), `staging` (no approval), `production` (1 reviewer, restricted to `main`). OIDC to Cloudflare/GitHub providers where supported; long-lived tokens only for Vercel/Resend/Razorpay, stored per environment. Secret inventory and rotation: See 10_SECURITY.md § SD-019.
