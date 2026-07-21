# SuRakshaAI — Your Shield Against Digital Fraud

A unified, explainable AI platform that detects scam messages, counterfeit currency, and
malicious payment QR codes/links — live, via camera or paste — fuses them into one fraud
risk score, and gives citizens and investigators a transparent, actionable view of the
threat, including a live scalability demo and one-tap mock complaint filing.

Built as a hackathon prototype. Fully local, runs with one `npm run dev`.

## What makes this different from a typical fraud-detection demo

These are the five unique differentiators — call these out explicitly to judges:

1. **Universal Auto-Detect Drop Zone** — one entry point on the home page. Drop an image or
   paste text/a link and the app figures out on its own whether it's a currency note, a QR
   code, or scam text, then routes it to the right analyzer with the analysis already running.
2. **Reasoning Trace animation** — every verdict plays a step-by-step "the AI is thinking"
   animation showing each signal being checked before the final score is revealed. This is
   the visual proof behind the explainability claim, not just a spinner.
3. **Similar Cases Matcher** — every result is checked against a keyword + region similarity
   index over real case data, surfacing "this matches N other reports nearby."
4. **Live Stress Test simulator** — a dashboard button injects ~500 synthetic cases in one
   burst and the stat cards, trend chart, and map update live, demonstrating the data model
   scales without any UI rework.
5. **One-tap mock Cybercrime Complaint generator** — auto-drafts an NCRP-style complaint from
   any flagged case, ready to copy. Clearly local/mock only — it never calls a real government
   endpoint.

## Important framing: what the "AI" actually is

Every detector in this project (scam text, currency image, QR/link) is a **transparent,
weighted, rules-based heuristic engine** — not a trained deep-learning model. This is a
deliberate choice, not a limitation: it means every verdict comes with a fully auditable
reasoning trace ("urgency language found", "aspect ratio out of range", "shortened URL
detected"), which is a much stronger fit for the Explainable AI judging criterion than a
black-box classifier would be. The README and code comments say this plainly everywhere it
matters — see `server/lib/scamTextScorer.js`, `server/lib/currencyAnalyzer.js`, and
`server/lib/linkAnalyzer.js` for the actual rules.

## What's real vs. mocked/simulated

| Feature | Status |
|---|---|
| Scam text, currency, QR/link heuristic scoring | Real, runs live against your input |
| Reasoning Trace, Explainability panel, Risk Gauge | Real, driven by actual analyzer output |
| Similar Cases Matcher | Real keyword/Jaccard + region similarity over live DB data |
| Fraud Risk fusion (Unified Risk Score) | Real weighted-average computation |
| Citizen Assistant LLM replies | Real if `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is set; otherwise a scripted decision-tree fallback (never crashes without a key) |
| Case location (region/lat/lng) | Simulated — a stable per-session "approximate location" from a fixed list of Bengaluru localities, not real geolocation |
| Stress Test data | Explicitly synthetic, labeled `[Simulated]` in the case table |
| Cybercrime complaint draft | Local mock only — **never submitted to any real government portal** |
| Dashboard password gate | Demo-only client-side gate (`police123`), not real auth |
| Currency/counterfeit detection | Heuristic image features (aspect ratio, color histogram, edge-sharpness variance) — not real banknote forensics |

Nice-to-haves implemented: **CSV export**, **voice input** (Web Speech API, no key needed).
Nice-to-haves *not* implemented (time-boxed out, core scope prioritized): Hindi/English
toggle for the Assistant, dark/light mode toggle, geospatial heatmap overlay (the map uses
color-coded markers instead).

## Architecture

```mermaid
flowchart TB
    subgraph Client["React (Vite) Frontend"]
        AutoDetect["Universal Auto-Detect<br/>Drop Zone"]
        MsgUI["Message Checker"]
        CurUI["Currency Checker<br/>(upload / webcam)"]
        QrUI["QR Checker<br/>(live scan / upload / paste)"]
        Trace["Reasoning Trace +<br/>Explainability Panel"]
        Report["Unified Risk Report"]
        Chat["Citizen AI Assistant"]
        Dash["Investigation Dashboard<br/>(stats, chart, map, stress test)"]
        CaseUI["Case Detail<br/>(complaint + PDF)"]
    end

    subgraph API["Express API"]
        AnalyzeText["/api/analyze/text"]
        AnalyzeCur["/api/analyze/currency"]
        AnalyzeQr["/api/analyze/qr"]
        RiskAPI["/api/risk/fuse"]
        CasesAPI["/api/cases"]
        AssistantAPI["/api/assistant/chat"]
        StressAPI["/api/stress-test"]
    end

    subgraph Intelligence["Detection & Intelligence Layer"]
        ScamScorer["scamTextScorer.js<br/>(weighted rules engine)"]
        CurAnalyzer["currencyAnalyzer.js<br/>(Jimp: aspect ratio, histogram, edge variance)"]
        LinkAnalyzer["linkAnalyzer.js<br/>(UPI / URL heuristics)"]
        RiskEngine["riskEngine.js<br/>(weighted fusion → Unified Risk Score)"]
        SimilarCases["similarCases.js<br/>(keyword + region similarity)"]
        ComplaintGen["complaintGenerator.js<br/>(mock NCRP draft)"]
        AssistantEngine["assistantEngine.js<br/>(LLM if key present, else scripted fallback)"]
    end

    DB[("SQLite<br/>(better-sqlite3)")]

    AutoDetect --> MsgUI & CurUI & QrUI
    MsgUI --> AnalyzeText --> ScamScorer
    CurUI --> AnalyzeCur --> CurAnalyzer
    QrUI --> AnalyzeQr --> LinkAnalyzer
    ScamScorer & CurAnalyzer & LinkAnalyzer --> Trace
    ScamScorer & CurAnalyzer & LinkAnalyzer --> SimilarCases
    ScamScorer & CurAnalyzer & LinkAnalyzer --> DB

    Trace --> Report
    Report --> RiskAPI --> RiskEngine

    Chat --> AssistantAPI --> AssistantEngine
    Dash --> CasesAPI --> DB
    Dash --> StressAPI --> DB
    CaseUI --> CasesAPI
    CaseUI --> ComplaintGen
    SimilarCases --> DB
```

**Flow in one sentence:** the frontend feeds raw input (text, image, decoded QR/link) to one
of three detector modules, each of which returns a scored, step-by-step reasoning trace that
is rendered live, persisted to SQLite, matched against similar cases, and optionally fused
into a session-wide Unified Risk Score — while the dashboard and assistant read from the same
SQLite store to power investigation and citizen-facing conversation.

## Tech stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, hand-rolled shadcn-style components (Radix
  primitives for Accordion/Tabs), Recharts, Lucide icons, Framer Motion
- **Backend:** Node.js + Express (single server; serves the built frontend in production)
- **Database:** SQLite via `better-sqlite3`
- **Image analysis:** `jimp` (aspect ratio, color histogram, edge-sharpness variance)
- **QR decoding:** `jsQR`, client-side, from webcam frames or uploaded images
- **PDF generation:** `jspdf`
- **Maps:** Leaflet + OpenStreetMap tiles (no API key)
- **Citizen Assistant LLM:** `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` if present in the
  environment, otherwise a scripted decision-tree fallback — the server never crashes if
  neither key is set

## Project structure

```
suraksha-ai/
├── server/                  Express API + SQLite
│   ├── db/                  schema.sql, db.js, seed.js (~25 realistic seed cases)
│   ├── lib/                 the 7 core modules (scorers, risk engine, matcher, complaint gen)
│   ├── routes/               analyze.js, cases.js, assistant.js, risk.js, stress.js
│   └── index.js
├── client/                  React (Vite) frontend
│   └── src/
│       ├── components/      VerdictBadge, RiskGauge, ReasoningTrace, ExplainabilityPanel,
│       │                    AutoDetectDropZone, IncidentMap, TrendChart, CaseTable, ...
│       ├── pages/            Home, MessageChecker, CurrencyChecker, QrChecker,
│       │                    UnifiedReport, Assistant, Dashboard, CaseDetail
│       └── lib/               api.js, pdfReport.js, eli5.js, qrDecode.js, similarity helpers
├── PRESENTATION_OUTLINE.md
├── DEMO_SCRIPT.md
└── README.md
```

## How to run

Requires Node.js 20+.

```bash
# from the repo root
npm run install:all   # installs root, server, and client dependencies
npm run dev           # runs Express (port 5050) + Vite (port 5173/5174) together
```

Open the printed Vite URL (typically `http://localhost:5173`). The SQLite database is
created and seeded automatically on first server start — no manual setup needed.

Optional: to enable real LLM replies in the Citizen Assistant, set an environment variable
before starting the server:

```bash
export ANTHROPIC_API_KEY=sk-ant-...     # or
export OPENAI_API_KEY=sk-...
```

Without either key, the Assistant automatically uses its scripted decision-tree fallback —
this is expected behavior, not an error state.

**Dashboard demo password:** `police123` (shown directly on the login screen — this is a
demo-only client-side gate, not real authentication).

### Production build

```bash
npm run build   # builds the client into client/dist
npm start       # Express serves the API and the built frontend on one port
```

## Fallback notes (what changed from the original plan)

- **shadcn/ui** was not installed via its interactive CLI (it requires prompts incompatible
  with a scripted build). Instead, the same visual language was hand-built with Tailwind +
  Radix primitives (`@radix-ui/react-accordion`, `-tabs`) — functionally equivalent,
  same accessibility primitives shadcn itself wraps.
- **Tailwind CSS v4** was used instead of v3 (v3 is not the default `npm install` target
  anymore); configuration lives in `client/src/index.css` via `@theme` instead of a
  `tailwind.config.js` file.
- **Port 5000** conflicts with macOS AirPlay Receiver/ControlCenter on most Macs, so the
  Express server defaults to **port 5050** instead (override with `PORT=...`).
- **multer** was pinned to v2.x instead of the commonly-referenced v1.x line, since v1 has
  known unpatched vulnerabilities flagged by npm.
- Real device geolocation is **not** requested from the browser (avoids an extra permission
  prompt during a live demo); case locations use a simulated, session-stable "approximate
  location" from a fixed list of Bengaluru localities instead, clearly documented above.
