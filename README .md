# UBS FieldOS — AI-Powered Field Execution System

> **Voice-enabled field visit management app built for UltraTech Building Solutions (UBS), West Region — Gujarat + Mumbai**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ubsfieldvisitassistant.vercel.app-0F2744?style=for-the-badge)](https://ubsfieldvisitassistant.vercel.app)
[![Built with React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Powered by Nvidia AI](https://img.shields.io/badge/AI-Nvidia%20Llama%203.3-76B900?style=for-the-badge&logo=nvidia)](https://build.nvidia.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)

---

## The Problem

UltraTech Building Solutions field managers visit **600+ dealers across 19 depots** in Gujarat and Mumbai every day. Before this app:

- Visit notes were typed as WhatsApp messages — scattered, unsearchable, forgotten
- Action points were never formally assigned — no owner, no deadline, no accountability
- Management had **zero visibility** into field execution status
- TRHs forgot commitments within hours of the visit
- Follow-ups happened over phone calls with no record
- Manual Excel tracking became outdated before the next meeting

**Result:** Dealer issues stayed unresolved. Revenue opportunities were missed. Senior management had no way to track what was happening on the ground.

---

## The Solution

A **voice-first, AI-powered mobile web app** that transforms field visits from WhatsApp chaos into structured, trackable execution.

### How it works — in 4 steps

```
SPEAK → AI EXTRACTS → WHATSAPP SENDS → DASHBOARD TRACKS
```

1. **Field manager taps Speak** — says the visit in natural language
2. **AI (Nvidia Llama 3.3) extracts** — dealer, depot, discussion, action, assignee, priority, deadline
3. **WhatsApp auto-opens** — pre-filled message sent to TRH with full action points
4. **Dashboard tracks everything** — open, overdue, closed — live for management

---

## Live Demo

🔗 **[ubsfieldvisitassistant.vercel.app](https://ubsfieldvisitassistant.vercel.app)**

| Role | Name | Password |
|------|------|----------|
| Function Head | Vaibhav Goyal | Admin1234 |
| ZRH (Admin) | Naveen Ahuja | admin123 |
| TRH | Mayur Sardhara | mayur123 |

---

## Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice-to-AI** | Speak visit notes → Nvidia Llama extracts structured data |
| 📲 **WhatsApp Integration** | Auto-sends action points to TRH on visit submission |
| 📊 **Live Dashboard** | Open actions, overdue alerts, TRH-wise closure rates |
| 📥 **Excel Export** | TRH-wise action report — 4 sheets, one tap download |
| 🔔 **Smart Notifications** | Overdue + due-soon alerts with bell icon |
| 👥 **Role Hierarchy** | FH → ZRH → TRH → RE with role-based access |
| 🏪 **600+ Dealers** | Pre-loaded with contact numbers across 19 depots |
| 🔄 **Real-time Sync** | Supabase backend — changes reflect on all devices instantly |
| 🔑 **Change Password** | Each user can update their own password |
| 📱 **Installable PWA** | Add to home screen on Android and iPhone |

---

## Tech Stack

```
Frontend        →  React 18 + Vite  (PWA, mobile-first)
AI / Voice      →  Nvidia Llama 3.3 via Vercel Serverless Function
Database        →  Supabase (PostgreSQL + real-time subscriptions)
Deployment      →  Vercel (auto-deploy from GitHub)
WhatsApp        →  wa.me deep link (Android + iOS compatible)
Speech          →  Web Speech API (browser-native, free)
Export          →  SheetJS (xlsx) — client-side Excel generation
Notifications   →  Web Push API + in-app bell
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   USER (Browser/Phone)               │
│         React PWA — Mobile-first UI                  │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
    ┌──────────▼──────┐  ┌───────▼────────────┐
    │  Vercel Edge    │  │   Supabase          │
    │  Serverless     │  │   PostgreSQL        │
    │  Functions      │  │   + Real-time       │
    │                 │  │                     │
    │ /api/login      │  │  users              │
    │ /api/parse-visit│  │  dealers (600+)     │
    │ /api/test-db    │  │  trhs / res         │
    └──────────┬──────┘  │  visits / actions   │
               │          │  categories         │
    ┌──────────▼──────┐  └─────────────────────┘
    │  Nvidia API     │
    │  Llama 3.3-70b  │
    │  (Free tier)    │
    └─────────────────┘
```

---

## Project Structure

```
ubs-fieldos/
├── api/                          # Vercel serverless functions
│   ├── login.js                  # Server-side auth (bypasses CORS)
│   ├── parse-visit.js            # Nvidia AI voice parser
│   └── test-db.js                # Supabase connection test
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx         # 5-tab navigation
│   │   ├── ChangePassword.jsx    # Password change modal
│   │   ├── OverdueNotifications.jsx  # Bell + push notifications
│   │   ├── Toast.jsx             # Toast notifications
│   │   └── TopBar.jsx            # Header with user + bell
│   ├── context/
│   │   └── AppContext.js         # Global state provider
│   ├── data/
│   │   └── masterData.js         # 600+ dealers + 11 TRHs (offline)
│   ├── lib/
│   │   ├── db.js                 # All Supabase CRUD operations
│   │   └── supabase.js           # Supabase client init
│   └── pages/
│       ├── Actions.jsx           # Action board with filters
│       ├── Dashboard.jsx         # KPI dashboard + charts
│       ├── Depots.jsx            # 19 depots with stats
│       ├── Export.jsx            # TRH-wise Excel export
│       ├── History.jsx           # Dealer visit timeline
│       ├── Login.jsx             # Auth page
│       ├── Masters.jsx           # Manage users/dealers/TRH/RE
│       └── NewVisit.jsx          # Voice-first visit entry
├── public/
│   └── manifest.json             # PWA manifest
├── supabase-schema.sql           # Database schema
├── supabase-seed-data.sql        # 600+ dealers + 11 TRHs
├── vercel.json                   # Vercel routing config
└── vite.config.js                # Build config
```

---

## Setup & Deployment

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Vercel account (free)
- Nvidia Build account (free API)

### 1. Clone the repo
```bash
git clone https://github.com/Aputar/UBS_Field-Visit_Assistant.git
cd UBS_Field-Visit_Assistant
npm install
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in SQL Editor
3. Run `supabase-seed-data.sql` to load all dealers + TRHs

### 3. Get Nvidia API Key
1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Generate API key (free tier available)
3. Note the model: `meta/llama-3.3-70b-instruct`

### 4. Configure Vercel Environment Variables
```
VITE_SUPABASE_URL        = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY   = eyJhbGci...
NVIDIA_API_KEY           = nvapi-...
NVIDIA_MODEL             = meta/llama-3.3-70b-instruct
```

### 5. Deploy
```bash
# Push to GitHub → Vercel auto-deploys
git add .
git commit -m "deploy"
git push
```

---

## Key Design Decisions

**Why voice-first?**
Field managers won't fill forms during visits. They will speak. Voice + AI solves the data capture problem — everything downstream (tracking, accountability, reporting) follows naturally.

**Why Nvidia Llama over GPT-4?**
Free API tier with strong multilingual performance for Indian English/Hinglish. The `meta/llama-3.3-70b-instruct` model handles field visit context extraction accurately.

**Why Supabase over Firebase?**
PostgreSQL gives us proper relational queries for TRH-wise, depot-wise reporting. Real-time subscriptions handle cross-device sync without polling.

**Why PWA over native app?**
Instant deployment — no App Store/Play Store approval. Users install via "Add to Home Screen." Updates deploy automatically. Works on any phone.

**Why serverless login?**
Browser-side Supabase client can face CORS/RLS issues on some networks. Server-side login via Vercel function is reliable across all devices and networks.

---

## Business Impact

- **Visit documentation:** 10 minutes → under 1 minute
- **Action accountability:** Every action has owner + deadline + status
- **Management visibility:** Real-time dashboard for FH/ZRH
- **Dealer coverage:** 600+ dealers tracked across 19 depots
- **Cost to run nationally:** Under ₹5,000/month
- **Build time:** 2 weeks using AI-assisted development

---

## Scalability Roadmap

- [ ] Pan-India rollout — multi-region support
- [ ] WhatsApp Business API — automated broadcasts
- [ ] GPS visit validation — field attendance tracking
- [ ] AI-generated MOM — PDF from visit notes
- [ ] Bulk user import — Excel upload for TRH/RE onboarding
- [ ] Custom domain — branded URL
- [ ] Role-based data isolation — ZRH sees only their region

---

## About

Built by **Apoorv Sharma** as part of the BITSoM MBA program (2025–2027).

**Course:** AI in Business: From Models to Agents

**Problem source:** Real field operations challenge at UltraTech Building Solutions, West Region

**Deployed to:** 15 active users across Gujarat and Mumbai — FH, ZRH, 11 TRHs

> *This project demonstrates that AI-assisted development can solve real enterprise problems faster and cheaper than traditional software teams — from problem to production in 2 weeks, at near-zero cost.*

---

## License

This project is proprietary. Built for UltraTech Building Solutions internal use.
The codebase is shared publicly for portfolio and educational purposes only.
