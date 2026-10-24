# Sherlog 🕵️‍♂️
### Incident-Investigation Multi-Agent System
**Open Agent Hackathon 2026 — Track: The Agent That Can Explain Why**

> When a critical software incident occurs, Sherlog investigates across fragmented telemetry sources (logs, git diffs, deploy histories, metrics, tickets), unmasks deceptive red herrings, and explains the root cause with verified, cited evidence.

---

## 🎯 Hard Requirements Compliance

| Requirement | Implementation in Sherlog | Status |
| :--- | :--- | :---: |
| **Zetaris as Only Data Layer** | All evidence queries route strictly through Zetaris (`zetaris.logs`, `zetaris.deploy_history`, `zetaris.config_repo`, `zetaris.metrics`, `zetaris.tickets`). Supports local Docker endpoint (`ZETARIS_ENDPOINT`) and zero-config sample virtualization. | ✅ Verified |
| **Meterless Nightshift as Primary AI** | Every model call routes through Meterless Nightshift (`NIGHTSHIFT_BASE_URL`). No direct calls to any other provider. Every request logs the model, latency, and tokens. | ✅ Verified |
| **NVIDIA Nemotron via Nightshift** | The Risk/Domain Agent uses `nvidia/nemotron-4-340b-instruct` via Nightshift to challenge candidate hypotheses, detect red herrings, and calibrate confidence. | ✅ Verified |
| **Meterless Engine in Real Feature** | Implemented **H-MEM Engine** (`meterless/h-mem-v2`) for hierarchical episodic incident memory recall, retrieving past post-mortems and remediation actions. | ✅ Verified |
| **Automated Passing Test** | Automated test suite (`npm run test`) testing H-MEM Engine, Zetaris data layer, and Evaluator agent logic. | ✅ 3/3 Passing |
| **Zero-Config Sample Mode** | Runs immediately with no external credentials or Docker required using bundled ground truth and synthetic generator. | ✅ Built-in |
| **Ground Truth + Red Herrings** | Seeded with 2 full benchmark incidents plus a holdout incident, each featuring planted red herrings to test agent causal rigor. | ✅ 3 Incidents |

---

## 🏗️ Architecture & Multi-Agent Loop

Unlike linear pipelines, Sherlog executes a feedback-driven agent loop with shared state, temporal audits, and loopback critique cycles:

```
          ┌──────────────────────────────────────────────────────────┐
          │                   Incident Alert Trigger                 │
          └─────────────────────────────┬────────────────────────────┘
                                        │
                         ┌──────────────▼─────────────┐
                         │   Meterless H-MEM Engine   │ (Recalls similar past incidents)
                         └──────────────┬─────────────┘
                                        │
           ┌────────────────────────────▼────────────────────────────┐
           │                      Planner Agent                      │◄────────┐
           │       (Zetaris federated query schedule across tables)  │         │
           └────────────────────────────┬────────────────────────────┘         │
                                        │                                      │
                         ┌──────────────▼─────────────┐                        │
                         │     Investigator Agent     │                        │
                         │  (Runs SQL through Zetaris)│                        │
                         └──────────────┬─────────────┘                        │
                                        │                                      │
                         ┌──────────────▼─────────────┐                        │
                         │    Hypothesis Synthesis    │                        │
                         │ (Maps root causes to IDs)  │                        │
                         └──────────────┬─────────────┘                        │
                                        │                                      │
                         ┌──────────────▼─────────────┐                        │
                         │      Evaluator Agent       │                        │
                         │ (Audits citations & timing)├─[Critique / Retries]───┘
                         └──────────────┬─────────────┘
                                        │ (Passed audit)
                         ┌──────────────▼─────────────┐
                         │   Risk/Domain Agent        │
                         │  (NVIDIA Nemotron 340B)    │ (Exposes red herrings, calibrates confidence)
                         └──────────────┬─────────────┘
                                        │
                         ┌──────────────▼─────────────┐
                         │       Final Output         │
                         │  - Ranked Root Causes      │
                         │  - Causal "Why" Details    │
                         │  - Clickable [EV-xxx] Citations
                         │  - Rubric Scorecard        │
                         └────────────────────────────┘
```

---

## 🔍 Seeded Benchmark Incidents

1. **INC-8921: Checkout 500s & Cart Abandonment**
   - **Ground Truth Cause**: Release `checkout-v3.18.2` committed diff in `config/database.yaml` shrinking `pool.max_connections` from 50 to 5 (`EV-CFG-102`), starving HikariCP pools under normal 1,200 req/sec checkout traffic.
   - **Planted Red Herring**: External payment gateway (PayStream) timeout logged at 14:19:30Z (`EV-LOG-105`). Nemotron unmasks that internal DB pool starvation started at 14:17:45Z, disqualifying the payment gateway as a downstream symptom.

2. **INC-6402: Elasticsearch High Search Latency (>4.8s p99)**
   - **Ground Truth Cause**: Kubernetes CronJob migration PR #492 in `k8s/catalog-indexer-cron.yaml` accidentally committed schedule `*/5 * * * *` (every 5 minutes) instead of nightly `0 2 * * *` (`EV-CFG-201`), causing overlapping bulk re-indexing jobs that saturated ES cluster CPU (98.6%).
   - **Planted Red Herring**: Frontend release `web-storefront:v2.4.1` deployed 10 minutes prior (`EV-DEP-205`). Nemotron verifies diff is purely cosmetic CSS/autocomplete debounce and rules it out.

3. **INC-3190: Holdout Incident — Cascading API Gateway JWT 401s**
   - **Ground Truth Cause**: `systemd-timesyncd` crashed on worker node `auth-worker-03` causing +94-second forward clock drift (`EV-LOG-301`). Tokens minted with future `nbf` claims were rejected by gateway verifiers.
   - **Planted Red Herring**: Patroni database replica failover alert logged 15 minutes prior (`EV-LOG-304`), which completed cleanly without dropping queries.

4. **Synthetic Incident Generator**:
   - Click **"Synthesize Incident"** in the dashboard to generate randomized incidents across logs, deploys, metrics, and configs with zero personal data.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js $\ge 18$ or Bun
- (Optional) Zetaris Docker container & Meterless Nightshift API key for live mode

### 2. Install & Run Development Server
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### 3. Run Automated Tests
```bash
npm run test
```
The test suite validates:
- **Meterless Engine: H-MEM**: Episodic incident memory recall, vector matching, and past resolution retrieval.
- **Zetaris Federated Data Layer**: Query execution, table extraction, and sample-virtualized fallback.
- **Evaluator Agent**: Citation validity, detection of hallucinated/phantom evidence IDs, and timeline consistency.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
# Meterless Nightshift AI Configuration (PRIMARY AI Provider)
NIGHTSHIFT_API_KEY=""
NIGHTSHIFT_BASE_URL="https://api.meterless.ai/v1"
NIGHTSHIFT_ROUTER_MODEL="meterless/nightshift-router-v1"
NIGHTSHIFT_NEMOTRON_MODEL="nvidia/nemotron-4-340b-instruct"

# Meterless Engine Configuration
METERLESS_ENGINE="H-MEM"
METERLESS_ENGINE_KEY=""

# Zetaris Network Data Layer (Dockerized local service)
ZETARIS_ENDPOINT="http://localhost:8080/v1/query"
ZETARIS_AUTH_TOKEN=""
ZETARIS_TIMEOUT_MS="5000"

# Mode: "sample" (no credentials/Docker required) or "live"
SHERLOG_MODE="sample"
```

---

## 📊 Evaluator Agent Rubric

Every investigation is audited by the Evaluator Agent across 4 dimensions:
1. **Citation Validity**: $100\%$ of cited claims must map to a real evidence ID in the Zetaris store. Zero phantom/hallucinated IDs permitted.
2. **Temporal Consistency**: Root-cause evidence timestamps $T_{\text{cause}}$ must strictly precede the alert $T_{\text{alert}}$ and symptom onset.
3. **Alternatives Probed**: Competing hypotheses and red herrings must be explicitly evaluated and debunked.
4. **Calibrated Confidence**: High confidence is only granted when evidence margins separate the root cause from side-effects.
