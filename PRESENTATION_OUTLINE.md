# SuRakshaAI — Presentation Outline

Slide-by-slide content for a hackathon pitch deck. Aim for 8–10 slides, ~30–45 seconds each.

---

## Slide 1 — Title

**SuRakshaAI — Your Shield Against Digital Fraud**
A unified, explainable AI platform for scam messages, counterfeit currency, and payment
QR/link fraud.

*Subtext: Built for citizens verifying suspicious content, and for police/cyber-cell
investigators tracking fraud patterns at scale.*

---

## Slide 2 — The Problem

- Citizens face three separate, fragmented fraud vectors — scam texts, fake currency, and
  malicious payment QR codes/links — with no single tool to check any of them quickly.
- Existing tools that do exist are reactive (report after the fact) and rarely explain *why*
  something is flagged, so users don't build the intuition to catch the next scam themselves.
- Law enforcement lacks a live, aggregated view of fraud patterns and hotspots to prioritize
  response.

---

## Slide 3 — The Idea

One unified, explainable risk engine across all three vectors, with a single smart entry
point: drop anything — a photo, a QR, a pasted message — and the system figures out what it
is, analyzes it, and shows its work.

---

## Slide 4 — Differentiator #1: Universal Auto-Detect Drop Zone

- One drop zone on the home page. No menus to navigate, no "which checker do I need."
- Auto-detects image → QR code vs. currency note (via client-side QR decode attempt), and
  text → payment link vs. scam message (via pattern match), then routes with analysis
  already running.
- *Demo beat: drop a QR image and a scam text back-to-back, show instant correct routing.*

---

## Slide 5 — Differentiator #2: Reasoning Trace (the Explainability signature)

- Every verdict plays a short, animated "thinking" sequence — each signal checked one at a
  time, live: "Checking urgency language... found," "Checking suspicious links... found."
- This isn't cosmetic — it's a literal visualization of the rules engine's actual decision
  path, paired with an ELI5 / Technical toggle so both a citizen and an investigator get the
  right depth of explanation.
- *Demo beat: run a scam message live and let the trace play out on screen.*

---

## Slide 6 — Differentiator #3: Similar Cases + Fraud Risk Fusion

- Every result is matched against existing case data via keyword + region similarity —
  "this matches N other reports nearby" — turning one check into pattern awareness.
- Multiple checks in a session fuse into one weighted Unified Risk Score (35% message / 35%
  currency / 30% QR), giving a single number for "how risky is what I've seen today."

---

## Slide 7 — Differentiator #4: Live Stress Test (Scalability, live on stage)

- One button on the Investigation Dashboard injects ~500 synthetic fraud cases in a single
  burst.
- Stat cards, the trend chart, and the Leaflet incident map all update live and smoothly —
  proving the data model and UI scale without any rework, in front of the judges, in seconds.
- *Demo beat: click it live, narrate the case count jumping and the map filling in.*

---

## Slide 8 — Differentiator #5: One-Tap Complaint Generator

- Any flagged case gets an auto-filled, NCRP-style complaint draft — category, incident
  details, AI findings, suggested next steps — ready to copy.
- Explicitly local/mock only: **never submitted to any real government system.** This is a
  drafting aid, not a filing pipeline — said upfront to avoid any confusion.

---

## Slide 9 — Architecture & Tech Stack

- React (Vite) + Tailwind + Framer Motion frontend, Express + SQLite backend, all running
  locally with one `npm run dev`.
- Three heuristic detector modules (scam text, currency image, QR/link) feed a weighted risk
  fusion engine; a similarity matcher and the Citizen Assistant sit alongside as the
  "intelligence layer."
- *(Show the Mermaid architecture diagram from the README here.)*

---

## Slide 10 — Why "heuristic" is a feature, not a limitation

- Every detector is a transparent, weighted rules engine — not a black-box deep model.
- That means every single verdict is fully auditable: you can point at the exact rule that
  fired. For an Explainable AI criterion, that's a stronger story than "trust the model."
- Clearly documented in the README so judges see this as a deliberate design choice.

---

## Slide 11 — Judging Criteria Alignment

| Criterion | How SuRakshaAI delivers |
|---|---|
| Innovation | Unified cross-vector detection + auto-detect entry point, not another single-purpose scam checker |
| Explainability | Reasoning Trace animation + ELI5/Technical toggle on every verdict, rules-based engine by design |
| Technical execution | Full-stack, real image/QR/text analysis, live camera capture, working PDF/CSV export, live stress test |
| Real-world impact | Citizen-facing (verify before you act) *and* investigator-facing (dashboard, patterns, complaint drafts) |
| Scalability | Live demo of 500-case burst insert with smooth UI updates |

---

## Slide 12 — Impact & What's Next

- Today: citizens get instant, explainable answers; investigators get a live aggregated view.
- Next: real LLM-backed assistant at scale, multilingual support, integration with real
  reporting portals under proper legal/compliance review, and a trained model layer *on top
  of* the existing rules engine for hybrid explainability.

---

## Slide 13 — Thank You / Live Demo

Hand off to `DEMO_SCRIPT.md` for the live walkthrough.
