# SecureShield / PhishGuard — Project Guide

## Overview

SecureShield (also referred to as PhishGuard) is an **AI-powered phishing URL and scam message detection** application available as both a **web app** (React + Vite) and a **mobile app** (React Native + Expo). Users can scan URLs and text messages for malicious content, view dashboard analytics, track scan history, download PDF reports, and submit feedback to improve detection accuracy.

The project contains only **frontend clients**. The backend ML service is a separate Java Spring Boot application (not included in this repository).

---

## Architecture

```
┌─────────────────────────────────────────────┐
│            Frontend Clients                  │
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Web App        │  │  Mobile App      │  │
│  │  React + Vite   │  │  React Native    │  │
│  │  localhost:5173 │  │  Expo managed    │  │
│  └────────┬────────┘  └───────┬──────────┘  │
│           │                   │              │
└───────────┼───────────────────┼──────────────┘
            │                   │
            ▼                   ▼
    ┌───────────────────────────────┐
    │     Backend API (Spring Boot) │
    │     http://localhost:8080/api  │
    │     http://192.168.1.80/api   │
    └───────────────────────────────┘
```

---

## Tech Stack

### Web App (`phishing-detection-frontend/`)

| Dependency | Version | Purpose |
|---|---|---|
| React | ^18.2.0 | UI framework |
| Vite | ^4.4.5 | Build tool & dev server |
| React Router DOM | ^6.14.0 | Client-side routing |
| Axios | ^1.4.0 | HTTP client |
| Recharts | ^2.7.0 | Charts (area, pie, line) |
| jsPDF + jspdf-autotable | ^2.5.1 | PDF report generation |
| react-hot-toast | ^2.6.0 | Toast notifications |
| react-icons | ^4.12.0 | Icon library |
| react-loader-spinner | ^5.3.4 | Loading animations |
| date-fns | ^2.30.0 | Date formatting |

### Mobile App (`PhishGuardMobile/`)

| Dependency | Version | Purpose |
|---|---|---|
| React Native | 0.74.5 | Mobile UI framework |
| Expo | ~51.0.0 | Managed workflow & tooling |
| React Navigation | 6.x | Navigation (bottom tabs, stacks) |
| Axios | ^1.6.0 | HTTP client |
| AsyncStorage | 1.23.1 | Persistent local storage (theme) |
| @expo/vector-icons | ^14.0.3 | Icons (Ionicons) |
| expo-font / expo-asset | ~12.x / ~10.x | Font and asset loading |

---

## Directory Structure

```
.
├── phishing-detection-frontend/   # Web React app
│   ├── index.html                 # SPA entry point
│   ├── vite.config.js             # Vite configuration
│   ├── package.json               # Dependencies & scripts
│   ├── public/                    # Static assets
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Root component (routing, theme, layout)
│       ├── pages/
│       │   ├── Dashboard.jsx      # Stats, charts, recent scans
│       │   ├── URLScanner.jsx     # URL scanning page
│       │   ├── MessageScanner.jsx # Message scanning page
│       │   └── History.jsx        # Scan history list & details
│       ├── components/
│       │   ├── common/
│       │   │   ├── Navbar.jsx     # Top navigation bar
│       │   │   ├── Footer.jsx     # Site footer
│       │   │   ├── ThemeToggle.jsx # Light/Dark/System toggle
│       │   │   ├── RiskBadge.jsx  # Risk level badge
│       │   │   ├── LoadingSpinner.jsx # Loading indicator
│       │   │   └── ErrorBoundary.jsx # Error boundary component (fully implemented)
│       │   ├── dashboard/
│       │   │   ├── StatCard.jsx   # Stats display card
│       │   │   ├── TrendChart.jsx # Detection trends line chart
│       │   │   └── RecentScansTable.jsx # Recent scans table
│       │   └── scanner/
│       │       ├── URLInput.jsx      # Placeholder
│       │       ├── MessageInput.jsx  # Placeholder
│       │       └── ResultCard.jsx    # Placeholder
│       ├── services/
│       │   ├── api.js             # Axios API client
│       │   └── pdfGenerator.js    # PDF report generation (jsPDF)
│       ├── context/
│       │   └── ThemeContext.jsx   # Theme provider (light/dark/system)
│       ├── hooks/
│       │   ├── useScan.js         # Placeholder
│       │   └── useHistory.js      # Placeholder
│       ├── utils/
│       │   ├── constants.js       # Risk thresholds, endpoints, messages
│       │   ├── validators.js      # URL & message validation
│       │   └── formatters.js      # Date, score, risk level formatters
│       └── styles/
│           ├── theme.js           # Light & dark theme objects
│           ├── globals.css        # Design system CSS variables
│           ├── components.css     # Component-level styles
│           └── mobile.css         # Responsive breakpoints
│
└── PhishGuardMobile/              # Mobile React Native app
    ├── App.js                     # Root component (navigation, theme)
    ├── app.json                   # Expo configuration
    ├── package.json               # Dependencies & scripts
    ├── eas.json                   # EAS Build config
    ├── babel.config.js            # Babel config
    ├── generate-assets.js         # Icon/splash asset generator
    ├── AGENTS.md                  # AI assistant notes
    └── src/
        ├── screens/
        │   ├── DashboardScreen.jsx    # Stats, CTA buttons, recent scans
        │   ├── URLScannerScreen.jsx   # URL scanning
        │   ├── MessageScannerScreen.jsx # Message scanning
        │   └── HistoryScreen.jsx      # Scan history
        ├── components/
        │   ├── Navbar.jsx         # Slide-in navigation drawer
        │   ├── ResultCard.jsx     # Scan result display
        │   ├── RiskBadge.jsx      # Risk level inline badge
        │   ├── ThemeToggle.jsx    # Modal theme selector
        │   └── LoadingSpinner.jsx # Centered loading indicator
        ├── services/
        │   └── api.js             # Axios API client
        ├── context/
        │   └── ThemeContext.jsx   # Theme provider (AsyncStorage-backed)
        ├── constants/
        │   └── colors.js          # Light/dark color palettes
        └── utils/
            └── validators.js      # Validation + formatting utilities
```

---

## Key Features

### 1. URL Scanning
- Input a URL and scan it against ML-based phishing detection
- Results show: risk score (0–100%), classification, explanation, detailed features (e.g., has HTTPS, contains IP address, special characters, etc.)
- Risk thresholds: 0–30 Low Risk, 31–70 Medium Risk, 71–100 High Risk

### 2. Message Scanning
- Input a text message (10–1000 characters) for scam detection
- Results show: scam risk analysis, red flags detected, extracted embedded URLs, message analysis details

### 3. Dashboard
- Stats cards: Total Scans, Phishing URLs Found, Scam Messages Detected, Safe Detections
- Area chart showing weekly detection trends (phishing, scam, safe lines)
- Pie chart showing threat distribution
- Recent scans table with type badges, risk bars, and dates

### 4. Scan History
- Filter by All / URLs / Messages
- Search across scan content
- Detailed view modal with full scan results
- PDF report download per scan

### 5. PDF Reports
- Generated client-side with jsPDF
- Includes: scan info table, analysis explanation, features grid, security recommendation
- Auto-saved as `phishguard_report_<timestamp>.pdf`

### 6. Feedback System
- After each scan, users can submit feedback:
  - Star rating (mobile)
  - Thumbs up / thumbs down (web)
  - Optional comments
- Feedback sent to `/api/feedback` to help improve detection models

### 7. Theme Support
- Light, Dark, and System-preference themes
- Persisted to localStorage (web) or AsyncStorage (mobile)

### 8. Error Handling
- Comprehensive error boundaries implemented for both web and mobile apps
- User-friendly fallback UI with reset functionality
- Detailed error information available with expandable sections
- Graceful handling of API failures and unexpected errors

---

## API Reference

Both clients communicate with the same backend API. The base URL differs:

- **Web**: `http://localhost:8080/api`
- **Mobile**: `http://192.168.1.80/api` (change to your server's IP)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/scan/url` | Scan a URL. Body: `{ url: string }` |
| POST | `/scan/message` | Scan a message. Body: `{ message: string }` |
| GET | `/scans?type=url\|message` | Get scan history (optional type filter) |
| GET | `/scans/:type/:id` | Get single scan details |
| GET | `/dashboard/stats` | Get dashboard statistics |
| POST | `/feedback` | Submit feedback. Body: `{ scanId, type, isAccurate, comments, rating? }` |
| GET | `/reports/:type/:id/pdf` | Download PDF report |

**Expected scan result shape:**
```json
{
  "id": "string",
  "content": "string",
  "classification": "string",
  "riskScore": 0-100,
  "confidence": 0.0-1.0,
  "explanation": "string",
  "features": { "key": "value" },
  "date": "ISO timestamp"
}
```

---

## Setup & Installation

### Prerequisites
- Node.js >= 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli`) for mobile
- A running backend API server

### Web App

```bash
cd phishing-detection-frontend
npm install
npm run dev        # Starts dev server at http://localhost:5173
```

Other scripts:
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview the production build locally

### Mobile App

```bash
cd PhishGuardMobile
npm install
npx expo start     # Starts Expo dev server
```

- Scan the QR code with Expo Go (Android/iOS)
- Or press `a` for Android emulator / `i` for iOS simulator
- **Important**: Update `API_BASE_URL` in `src/services/api.js` to match your backend server's local network IP

**Building with EAS:**
```bash
npx eas build --profile development    # Dev build
npx eas build --profile preview        # Internal preview
npx eas build --profile production     # Production build
```

---

## Project Conventions

### Code Style
- No explanatory comments in source files
- Functional components with hooks (no class components)
- CSS custom properties for theming (web) or inline `StyleSheet.create` (mobile)
- Consistent light/dark theme pattern across both platforms

### Risk Scoring
| Score Range | Label | Color |
|---|---|---|
| 0–30 | Low Risk / Safe | Green (`#10b981`) |
| 31–70 | Medium Risk / Suspicious | Amber (`#f59e0b`) |
| 71–100 | High Risk / Dangerous | Red (`#ef4444`) |

### Scanning Validation
- **URL**: Must match `^(https?://)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*/?$`
- **Message**: 10–1000 characters, non-empty

### API Error Handling
All API methods catch errors and return `error.response?.data` with a fallback message.

---

## Production Build

```bash
cd phishing-detection-frontend
npm run build
# Output in dist/ — deploy to any static hosting

cd PhishGuardMobile
npx eas build --profile production
```

---

## Known Notes

- **NOTE: ErrorBoundary component is now fully implemented** (see ErrorBoundary.jsx, ErrorBoundary.jsx) - Unlike other placeholder components, this one has a complete error handling solution with user-facing fallback UI, error details, and reset functionality for both web and mobile.
- Various component files are **empty placeholders** (URLInput, MessageInput, ResultCard, useScan, useHistory). Their logic was inlined directly into page components.
- The `App.css` file contains legacy Vite template styles and is not actively used — the app uses `globals.css`, `components.css`, and `mobile.css`.
- Contact info in the Footer (Balkumari, Lalitpur, +977) suggests the team is based in **Nepal**.
- The mobile `AGENTS.md` file references Expo v56 docs — check the exact versioned docs before making changes.
