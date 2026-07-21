# SuRakshaAI — Live Demo Script (3–4 minutes)

Timed walkthrough. Practice this once end-to-end before presenting — the three highest-impact
live-demo beats (camera scan, Reasoning Trace, Stress Test) are marked **★**.

Pre-demo setup: have `npm run dev` already running, home page loaded, dashboard password
(`police123`) memorized, and a QR code (e.g. a UPI QR from any app, printed or on a second
phone screen) ready for the live scan beat.

---

### 0:00 – 0:20 | Open on the problem, then the home page

> "Citizens face three separate fraud threats — scam texts, fake currency, malicious payment
> QR codes — and no single tool checks all of them, let alone explains *why* something is
> dangerous. SuRakshaAI unifies all three into one explainable risk engine."

Land on the home page. Point at the **Universal Auto-Detect Drop Zone** front and center.

> "This is the flagship entry point — you don't pick a checker, you just drop whatever you
> have."

---

### 0:20 – 0:50 | Auto-Detect in action

Paste a scam-style message into the drop zone:

> `URGENT: your bank account will be blocked today. Share your OTP immediately to verify at bit.ly/verify-now`

Click **Auto-Detect & Analyze**. Narrate as it routes:

> "It recognized this as text, not a link, and routed straight to the Message Checker —
> already running."

---

### 0:50 – 1:40 | ★ Reasoning Trace (the explainability centerpiece)

Let the trace play out on screen without interrupting:

> "Watch this — this is the AI showing its work, one signal at a time: urgency language,
> threat language, OTP request, suspicious link. This isn't a loading animation — it's the
> literal rules engine executing live."

When the verdict lands (High Risk, ~90/100):

> "High Risk, 90 out of 100. Click into the Explainable AI panel —"

Toggle **ELI5 → Technical**:

> "ELI5 mode for a citizen, Technical mode for an investigator — same underlying rules,
> different depth."

Point at **Similar Cases**:

> "And it's already matched against other reports nearby — this isn't an isolated flag, it's
> a pattern."

---

### 1:40 – 2:15 | ★ Live camera scan (QR Checker)

Navigate to **QR Checker**, select **Live Scan**, click **Start Camera**, and hold up the
prepared QR code.

> "Live camera QR scanning, decoded client-side — no server round-trip needed just to read
> the code."

Let it auto-decode and show the verdict + reasoning trace for the QR/link result.

> "Same reasoning-trace pattern here — UPI handle checked, payee name checked, domain
> reputation checked."

---

### 2:15 – 2:35 | Unified Risk Report

Click **View unified risk report**.

> "Every check this session rolls up into one Unified Risk Score — a single number fusing
> message, currency, and QR signals, weighted by confidence."

---

### 2:35 – 3:15 | ★ Investigation Dashboard + Stress Test

Navigate to **Dashboard**, log in with `police123`.

> "This is the investigator side — stat cards, a case trend chart, an incident map, and a
> filterable case table, all backed by the same database citizens are writing to."

Click **Run Stress Test (+500 cases)**.

> "Watch this — I'm injecting 500 synthetic fraud cases in one burst."

As it completes (should take well under a second):

> "Stat cards, trend chart, and the map all update live and smoothly — this proves the data
> model and UI scale, not just the demo dataset."

---

### 3:15 – 3:45 | Case Detail + Complaint Generator

Click into any case. Scroll to **Actions**.

> "From any flagged case, one tap generates a formatted, NCRP-style complaint draft —
> category, incident details, AI findings, next steps. This is a local drafting aid only —
> it is never submitted to any real government system, and we say that plainly in the UI."

Click **Generate PDF Report**.

> "And the same case exports as a clean PDF for offline records."

---

### 3:45 – 4:00 | Close

> "Scam messages, counterfeit currency, and payment fraud — one explainable engine, one
> unified score, built for both the citizen checking before they act, and the investigator
> watching the pattern. Thank you."

---

## If something goes wrong live

- **Camera permission denied / no camera available:** fall back to the **Upload QR Image**
  or **Paste Link** tab in the QR Checker — same reasoning trace, same result.
- **LLM key not set:** the Citizen Assistant is expected to use its scripted fallback; don't
  apologize for this, it's documented behavior — just don't claim it's calling a live LLM.
- **Stress Test feels slow on a loaded machine:** it typically completes in well under a
  second; if the venue Wi-Fi/laptop is under load, narrate through it — the point is the UI
  handling 500 new rows without breaking, not raw speed.
