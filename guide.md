# SecureShield / PhishGuard — Project Guide

> Updated for the current codebase (Aug 2026). This document describes everything about the
> repository: overview, architecture, structure, tech stack, features, API, PDF reports,
> scanning rules, conventions, setup, and build/verification steps.

---

## 1. Overview

SecureShield (also shown as **PhishGuard** in some places) is an **AI-powered phishing detection &
scam message scanner** available as a **web app** and a **mobile app**. Users can:

- Scan a **URL** for phishing indicators.
- Scan a **message** for scam content and embedded phishing links.
- View **dashboard analytics**.
- Manage **scan history** (search, filter, details, delete) and **download PDF reports**.
- Submit **feedback** and an **accuracy vote** per scan.
- Register/login, update the profile, and change the password.
- Use the app in **guest mode** (scans kept in memory; sign-in required for history/PDF).

The repository currently contains **only the two client applications**. The backend (Spring Boot ML
service) is a separate project, not included here.

| Folder | Type | Stack |
|---|---|---|
| `phishing-detection-frontend/` | Web app | React 18 + Vite |
| `PhishGuardMobile/` | Mobile app (Android/iOS/web) | React Native 0.86 + Expo SDK 57 |

---

## 2. Repository Structure

```
.
├── package-lock.json                # Root lockfile
├── guide.md                         # This document
│
├── phishing-detection-frontend/     # ── WEB APP ───────────────────────────
│   ├── index.html                   # SPA entry
│   ├── vite.config.js               # Vite config + /api dev proxy
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── main.jsx                 # React entry
│       ├── App.jsx                  # Providers + Router + Layout + Toaster
│       ├── pages/
│       │   ├── Dashboard.jsx        # Stats, charts, recent scans
│       │   ├── URLScanner.jsx       # URL scanning
│       │   ├── MessageScanner.jsx   # Message scanning
│       │   ├── History.jsx          # History table, details, delete, PDF
│       │   └── Profile.jsx          # Profile + change password
│       ├── components/
│       │   ├── common/AuthModal.jsx, Navbar.jsx, Footer.jsx,
│       │   │        ThemeToggle.jsx, RiskBadge.jsx, LoadingSpinner.jsx,
│       │   │        ErrorBoundary.jsx, ProtectedRoute.jsx
│       │   ├── dashboard/StatCard.jsx, TrendChart.jsx, RecentScansTable.jsx
│       │   └── scanner/URLInput.jsx, MessageInput.jsx, ResultCard.jsx  # light placeholders
│       ├── services/
│       │   ├── api.js               # Axios client, interceptors, endpoints
│       │   └── pdfGenerator.js      # jsPDF report generation
│       ├── context/
│       │   ├── AuthContext.jsx      # Auth state, token in localStorage
│       │   ├── GuestContext.jsx     # Guest scans (in-memory)
│       │   └── ThemeContext.jsx     # Light/Dark/System
│       ├── hooks/useScan.js, useHistory.js, useGuestSession.js
│       ├── utils/constants.js, formatters.js, validators.js
│       └── styles/theme.js
│
└── PhishGuardMobile/                # ── MOBILE APP ─────────────────────────
    ├── App.js                       # Navigation (tabs + stack), providers
    ├── app.json                     # Expo config (ids, splash, apiUrl)
    ├── eas.json                     # EAS Build profiles
    ├── babel.config.js, metro.config.js
    ├── index.js, generate-assets.js
    ├── AGENTS.md, CLAUDE.md         # AI-assistant notes
    ├── android/                     # Generated native android project
    ├── LICENSE
    └── src/
        ├── screens/
        │   ├── DashboardScreen.jsx, URLScannerScreen.jsx,
        │   ├── MessageScannerScreen.jsx, HistoryScreen.jsx, ProfileScreen.jsx
        ├── components/
        │   ├── Navbar.jsx, ResultCard.jsx, RiskBadge.jsx, ThemeToggle.jsx,
        │   ├── LoadingSpinner.jsx, AuthModal.jsx, ProtectedRoute.jsx,
        │   └── ErrorBoundary.jsx, Toaster.jsx
        ├── services/
        │   ├── api.js               # Axios client (token in AsyncStorage)
        │   └── pdfGenerator.js      # expo-print HTML -> PDF
        ├── context/AuthContext.jsx, GuestContext.jsx, ThemeContext.jsx
        ├── constants/colors.js      # Light/dark palettes
        └── utils/validators.js, formatters.js, uuid.js
```

> The former `phishing-detection-ml-system/` backend reference is **removed** — the ML service is
> external.

---

## 3. Architecture

```
 ┌─────────────────────────────────────────────────────┐
 │                   Frontend Clients                  │
 │                                                     │
 │   phishing-detection-frontend      PhishGuardMobile │
 │   React + Vite (port 5173)         Expo / React Native │
 │        │                               │            │
 └────────┼───────────────────────────────┼────────────┘
          ▼                               ▼
   ┌──────────────────────────────────────────────┐
   │       Backend REST API (Spring Boot)         │
   │   https://mud-cable-passerby.ngrok-free.dev    │
   │   endpoints: /auth /scans /dashboard /feedback │
   └──────────────────────────────────────────────┘
```

- **Web client**: Bearer token from `localStorage`; sends `ngrok-skip-browser-warning: true` for
  ngrok tunnels; dev proxy `/api` -> tunnel (see `vite.config.js`).
- **Mobile client**: token from `AsyncStorage`; API base resolved from
  `EXPO_PUBLIC_API_URL` env -> `app.json` `expo.extra.apiUrl` -> default in `src/services/api.js`.
- Both clients use the **same endpoints and response shapes**.

---

## 4. Tech Stack

### 4.1 Web (`phishing-detection-frontend/`)

| Dependency | Version | Purpose |
|---|---|---|
| React | ^18.2.0 | UI |
| Vite | ^4.4.5 | Bundler / dev server |
| react-router-dom | ^6.14.0 | Routing |
| axios | ^1.4.0 | HTTP |
| recharts | ^2.7.0 | Charts on the dashboard |
| jspdf + jspdf-autotable | ^2.5.2 / ^3.8.4 | PDF reports |
| html2pdf.js | ^0.14.0 | Installed (PDF flow uses jsPDF directly) |
| react-hot-toast | ^2.6.0 | Toasts |
| react-icons | ^4.12.0 | Icons (FontAwesome) |
| react-loader-spinner | ^5.3.4 | Spinners |
| date-fns | ^2.30.0 | Dates |

Scripts: `npm run dev` · `npm run build` · `npm run preview`

### 4.2 Mobile (`PhishGuardMobile/`)

| Dependency | Version | Purpose |
|---|---|---|
| React Native | 0.86.0 | UI |
| Expo SDK | ~57.0.4 | Tooling + native modules |
| react / react-dom | 19.2.3 | Web target via `react-native-web` |
| @react-navigation (bottom-tabs, native, native-stack) | 6.x | Navigation |
| @react-native-async-storage/async-storage | 2.2.0 | Token + theme persistence |
| expo-print | ~57.0.1 | Render HTML -> PDF |
| expo-sharing | ~57.0.8 | Share the generated PDF |
| expo-file-system | ~57.0.0 | Legacy file fallback |
| expo-constants | ~57.0.3 | Read `expo.extra.apiUrl` |
| expo-linear-gradient | ~57.0.0 | Gradients |
| @expo/vector-icons | ^15.0.2 | Ionicons |
| react-native-blob-util | ^0.19.11 | Installed blob helper |
| uuid | ^14.0.1 | Guest scan IDs |

Scripts: `npm start` · `npm run android` · `npm run ios` · `npm run web`

---

## 5. Key Features

### 5.1 URL Scanning
- Input a URL (schema optional). Must pass `validateURL`.
- Calls `POST /scans/url`. Result shows risk score, prediction badge, classification, risk
  level, phishing/legitimate indicators, and a download button.

### 5.2 Message Scanning
- Input a message 10-1000 chars (`validateMessage`).
- Calls `POST /scans/messages`. Result shows overall + per-URL analysis, embedded URLs found,
  phishing/legitimate indicators for the message.

### 5.3 Dashboard
- Calls `GET /dashboard/stats`. Web shows stat cards + Recharts; mobile shows summary cards.

### 5.4 Scan History
- `GET /scans`; filters by type, search text, and date presets (today/yesterday/week/month/custom).
- Details modal, **Download PDF**, and **Delete** (authenticated users only; guests are read-only).
- Delete handles 401/403/404 + network errors gracefully.

### 5.5 PDF Reports
- See **section 8** for the full layout.

### 5.6 Feedback System
- Accuracy vote `POST /feedback/accuracy { reference, accurate }` (toogles on re-click).
- Comment `POST /feedback { message }`.

### 5.7 Authentication & Profile
- Register/login/logout (`/auth/*`), update profile and change password (protected).

### 5.8 Guest Mode
- Unauthenticated scans stored in memory (`GuestContext`). Guest entries are labelled "Guest";
  details/download/delete/history require sign-in.

### 5.9 Theming
- Light/Dark/System, persisted via `theme.js` (web) / `colors.js` + AsyncStorage (mobile).

### 5.10 Error Handling
- Error boundaries with friendly reset UI; friendly messages for network failures and HTTP
  errors.

---

## 6. API Reference

Base URL: `https://mud-cable-passerby.ngrok-free.dev`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account -> `{ accessToken, user }` |
| POST | `/auth/login` | Login -> `{ accessToken, user }` |
| POST | `/auth/logout` | Logout |
| PUT | `/auth/profile` | Update profile -> `{ user }` |
| PUT | `/auth/change-password` | Change password |
| POST | `/scans/url` | Scan URL, body `{ url }` |
| POST | `/scans/messages` | Scan message, body `{ message }` |
| GET | `/scans?type=url\|message` | List history (optional type filter) |
| GET | `/scans/{reference}` | Scan detail |
| DELETE | `/scans/{reference}` | Delete scan |
| GET | `/scans/{reference}/report` | Download report blob |
| GET | `/dashboard/stats` | Dashboard stats |
| POST | `/feedback` | Feedback comment, body `{ message }` |
| POST | `/feedback/accuracy` | Accuracy vote, body `{ reference, accurate }` |

Headers: `Authorization: Bearer <token>` (interceptor). Errors throw objects like
`{ message, status }`; 401/403/404 and network (ERR_NETWORK) handled per endpoint.

Typical scan object:
```json
{
  "reference": "uuid",
  "url": "...",
  "message": "...",
  "type": "url | message",
  "scanType": "URL | MESSAGE",
  "prediction": "PHISHING | SCAM | SUSPICIOUS | SAFE | LEGITIMATE",
  "overallPrediction": "...",
  "messagePrediction": "...",
  "riskScore": 85,
  "phishingReasons": ["..."],
  "messagePhishingReasons": ["..."],
  "legitimateReasons": ["..."],
  "messageLegitimateReasons": ["..."],
  "urlsFound": ["..."],
  "urlResults": [{ "prediction": "..." }],
  "conclusion": "...",
  "scannedAt": "..."
}
```

---

## 7. Risk Scoring & Validation

### 7.1 Risk score mapping (shared)

| Prediction | Risk Score |
|---|---|
| PHISHING / DANGEROUS / MALICIOUS | 85 |
| SCAM / SUSPICIOUS / WARNING | 55 |
| SAFE / LEGITIMATE | 15 |
| other / missing | 50 |

### 7.2 Risk level bands

| Score | Label | Color |
|---|---|---|
| > 70 | High | Red |
| > 30 | Medium | Amber |
| else | Low | Green |

### 7.3 Validation rules
- `validateURL(url)`: regex `^(https?://)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w_]*)*/?$` (http optional).
- `validateMessage(msg)`: non-empty, 10 <= length <= 1000.

---

## 8. PDF Report Generation

The layout is **aligned between web and mobile** so the same scan produces a nearly identical report.

### 8.1 Web (`src/services/pdfGenerator.js`)

- A4 portrait, jsPDF + autotable, margin 18 mm.
- Sections: header (brand + report ID + generated), SCAN SUMMARY card, SCAN DETAILS table,
  PHISHING/MESSAGE PHISHING INDICATORS, LEGITIMATE INDICATORS, URLS FOUND IN MESSAGE,
  ANALYSIS CONCLUSION, SECURITY RECOMMENDATION, footer with `Page i of n`.
- Alignment fixes in the latest refactor:
  - Conclusion and recommendation boxes auto-size (no overflow/overlap).
  - `ensureSpace()` forces page breaks before a section that won't fit a table.
  - Indicator tables combine `phishingReasons || messagePhishingReasons` into a single section.
  - Message scans no longer emit a bogus `URL` row when `url === message`.
  - `showHead: "everyPage"` keeps table headers on every page (no orphaned header).
- Output file: `security_report_<reference-or-timestamp>.pdf`.

### 8.2 Mobile (`PhishGuardMobile/src/services/pdfGenerator.js`)

- Builds **HTML** with the same content/order, then:
  - **Native**: `printToFileAsync({ html, width: 595, height: 842 })` -> `Sharing.shareAsync`
    (application/pdf). HTML fallback only if printing itself fails.
  - **Web**: hidden iframe + `contentWindow.print()` -> browser **Save as PDF** (no raw HTML).
- All values HTML-escaped (`escapeHtml`); `@page { size: 210mm 297mm; margin: 10mm }` +
  `page-break-inside: avoid`; single risk bar (no duplicate score).

---

## 9. Setup & Running

### 9.1 Prerequisites
- Node.js >= 18 and npm.
- Expo tooling for the mobile app.
- A running backend (for real scans). By default clients use the ngrok tunnel listed above.

### 9.2 Web
```bash
cd phishing-detection-frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve production build
```

### 9.3 Mobile
```bash
cd PhishGuardMobile
npm install
npx expo start --web    # or --android / --ios / --dev-client
```

Point the mobile app at your backend via `EXPO_PUBLIC_API_URL` or `expo.extra.apiUrl` in
`app.json`; otherwise it falls back to the tunnel URL.

### 9.4 EAS Build
```bash
cd PhishGuardMobile
npx eas build --profile development
npx eas build --profile preview
npx eas build --profile production   # optional --platform android
```
(`eas.json` contains the three profiles.)

---

## 10. Conventions

- Functional components with hooks; no class components.
- No explanatory comments in source (by convention).
- Web: inline styles + `theme.js`; Mobile: `StyleSheet.create` + `colors.js`.
- Provider tree:  ThemeProvider -> AuthProvider -> GuestProvider -> content.
- API error handling: `error.response?.data || { message }` with friendly fallbacks.
- Dates via date-fns (web) / custom (mobile).

### Quality / verification (used in this repo)
- Web: `npm run build` (Vite) - builds clean.
- Mobile: `npx expo export --platform web` and Babel transform of changed files - both pass.

---

## 11. Recent Updates (Aug 2026)

- PDF generators fully aligned on both platforms (auto-sized boxes, margins, no duplicated
  indicator messages, page-break logic, mobile web "Save as PDF" flow).
- Accuracy feedback toggle (re-click deselects) + inline error display.
- History: delete available for all authenticated users; guest scans read-only.
- API delete now emits `Accept/Content-Type: */*` headers.
- Guest mode across both apps.
- `vite.config.js` dev proxy to the ngrok tunnel.

---

## 12. Contact / Origin

- Based on the footer text (Balkumari, Lalitpur, +977), the team is based in **Nepal**.
- Mobile package: `com.secureshield.app`; EAS project id in `app.json`.

---

## 13. Helpful Gotchas & Notes

- PDF is generated **client-side**; no server round-trip for downloaded reports.
- Mobile AGENTS.md references Expo SDK 56 docs but the app uses **SDK 57** — match doc version.
- `android/` is a generated native project (expo prebuild); keep in sync when app.json changes.
- The web PDF flow uses jsPDF directly; `html2pdf.js` remains installed but is not the active path.
- Message scans historically stored the message text under `url`; the new generators filter that.