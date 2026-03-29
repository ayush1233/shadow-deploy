# Shadow Deploy — SaaS UI Rebuild Prompt

> Copy this entire prompt into Claude to rebuild your dashboard UI from scratch.

---

## Project Context

You are rebuilding the frontend dashboard for **Shadow API** — a SaaS platform that lets teams mirror production API traffic to a new version (shadow), compare every response using AI (Gemini), and get a deployment risk score before shipping. Think of it as "Vercel Previews but for APIs."

**Tech Stack (keep these exact):**
- React 18 + TypeScript + Vite
- `react-router-dom` v6 for routing
- `recharts` for charts
- `framer-motion` for animations
- `@supabase/supabase-js` for auth + database
- `react-diff-viewer-continued` for JSON diff views
- `axios` for proxy API calls
- `jspdf` + `jspdf-autotable` for PDF export
- `dompurify` for HTML sanitization

**Do NOT change:** the `services/api.ts` file, `services/supabase.ts`, `utils/exportCsv.ts`, or `utils/exportPdf.ts`. The data layer stays identical. You are only rebuilding the UI/UX layer.

---

## Design Direction — Premium SaaS (Sell-Ready)

The current UI is functional but looks like a hackathon project. Rebuild it to match the visual quality of **Linear, Vercel, Raycast, or Resend** — polished enough to charge $49/mo for.

### Design System Requirements

**Typography:**
- Primary display font: `"Satoshi", "General Sans", or "Cabinet Grotesk"` (import from CDN or Google Fonts alternative). Pick ONE distinctive geometric sans-serif — NOT Inter, NOT Roboto.
- Monospace for code/data: `"JetBrains Mono"` or `"Berkeley Mono"`.
- Hierarchy: Page titles 28–32px semibold, section headers 18–20px medium, body 14px regular, small labels 11–12px medium uppercase tracking-wide.

**Color Palette (Dark Theme Only):**
- Background layers: `#09090b` → `#0c0c0f` → `#111116` → `#18181d` (4-layer depth system)
- Cards: `rgba(255,255,255,0.03)` with `1px solid rgba(255,255,255,0.06)` border, `backdrop-filter: blur(12px)`
- Accent: A single hero color — electric indigo `#6366f1` with glow variants `rgba(99,102,241,0.15)` for hover states and `rgba(99,102,241,0.08)` for subtle backgrounds
- Semantic colors: green `#22c55e`, amber `#f59e0b`, red `#ef4444`, cyan `#06b6d4` — used ONLY for status/severity indicators
- Text: primary `#f4f4f5`, secondary `#a1a1aa`, muted `#52525b`
- Subtle gradients: Cards can have a faint top-border glow — `linear-gradient(to right, transparent, rgba(99,102,241,0.2), transparent)` as a `::before` pseudo-element

**Spatial Layout:**
- Collapsible sidebar (260px expanded → 64px icon-only collapsed) with smooth width transition
- Sidebar: frosted glass effect with subtle noise texture background
- Main content: max-width 1400px centered, 32px padding, 24px gap between sections
- Cards: 16px border-radius, 24px internal padding
- Use CSS Grid for dashboard layouts (not just flexbox everywhere)

**Motion & Animation (Framer Motion):**
- Page transitions: `AnimatePresence` with staggered fade+slide-up (`y: 20 → 0, opacity: 0 → 1, duration: 0.4s`)
- Card entrance: stagger children by 0.05s delay each
- Stat counters: animate numbers counting up on load using `useSpring` or custom hook
- Hover effects on cards: subtle `scale(1.01)` + border glow intensifies + faint shadow expansion
- Sidebar nav: active indicator slides smoothly (like a pill) between items using `layoutId`
- Charts: animate in with a wipe/draw effect
- Skeleton loaders: pulsing gradient shimmer (NOT just grey boxes) while data loads
- Micro-interactions: buttons have a slight press effect (`scale(0.98)` on active), toggles slide smoothly, dropdowns have spring physics

**3D & Depth Effects:**
- Network Topology page: render the service graph with CSS `perspective` and `transform: rotateX(5deg) rotateY(-5deg)` for a subtle 3D isometric tilt, with parallax on mouse move
- Cards cast layered shadows: `0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.4)`
- Risk score gauge: circular SVG gauge with animated gradient stroke + inner glow
- Login page: floating 3D mesh/grid background using CSS animation (subtle rotating gradient orbs or grid warp)

**Glassmorphism (use sparingly):**
- Sidebar and modal overlays: `background: rgba(12,12,15,0.8); backdrop-filter: blur(16px) saturate(1.5);`
- Toast notifications slide in from top-right with glass effect
- Tooltips: glass cards with subtle border

---

## Pages to Rebuild (8 Total)

### 1. Login Page (`/login`)
**Current:** Basic centered card with email/password fields + sign up link.
**Rebuild as:**
- Split layout: left 60% = brand showcase panel (product name "Shadow API" with tagline, floating abstract 3D visual or animated gradient mesh, social proof — "Trusted by 200+ engineering teams"), right 40% = auth form
- Auth form: email + password fields with floating labels (animate label up on focus), primary "Sign In" button with loading spinner, secondary "Create Account" toggle (same form, changes button text + shows confirm password), success/error toasts
- OAuth-ready placeholder row: "Or continue with" divider + ghost buttons for GitHub/Google (even if not wired up — shows SaaS readiness)
- Subtle animated background on the brand panel (CSS mesh gradient or moving dots/grid)
- Keep all existing Supabase auth logic (`signInWithPassword`, `signUp`, redirect to `/` on success, error handling)

### 2. Overview Dashboard (`/`)
**Current:** Stat cards + trend chart + pie chart + AI configurator input, all in a flat list.
**Rebuild as:**
- **Top bar:** Page title "Dashboard" left-aligned, right side = time range pills (7d/14d/30d — wired to `trendRange` state), export dropdown (CSV/PDF using existing export utils)
- **KPI strip:** 4 stat cards in a grid row — Total Requests, Mismatch Rate %, Deployment Risk Score (with circular gauge), Avg Latency Delta. Each card: icon top-left, large animated number, sparkline or trend indicator (↑ or ↓ with color), subtle label. Animate numbers counting up on load.
- **Risk Score Hero Card:** Full-width card below KPI strip. Left: large circular gauge (SVG, animated fill from 0 to `deployment_risk_score`, color shifts green→amber→red). Right: verdict text ("Safe to Deploy" / "Review Recommended" / "High Risk — Do Not Deploy"), recent trend mini-chart, and an action button "View Details →"
- **Charts Row (2 columns):**
  - Left: Risk & Pass Rate Trend (Area chart with gradient fill under the line, recharts). Wire to `trendData` state. Smooth animation on data change.
  - Right: Severity Breakdown (Donut chart, NOT pie chart — modern SaaS never uses full pie). Use the `severity` data from metrics.
- **AI Configurator Card:** Bottom section. Sleek input with a sparkle/AI icon, placeholder "Describe your proxy configuration in plain English...", submit button with loading state. Show success/error message as inline toast below the input. Wire to `configureProxy()`.
- **Recent Comparisons Quick-Table:** Last 5 comparisons as compact rows (endpoint, method badge, status match icon, severity dot, timestamp). Each row clickable → navigates to `/comparison/:requestId`.
- All data sourced from `getMetricsSummary()` and `getRiskTrend(trendRange)`.

### 3. Endpoint Analysis (`/endpoints`)
**Current:** Filterable table of comparisons with pagination.
**Rebuild as:**
- **Filter Bar:** Horizontal bar with: search input (filters by endpoint path), severity dropdown (all/none/low/medium/high/critical), time range dropdown (15m/1h/6h/24h/7d), and a "Clear Filters" button. Filters update via `listComparisons()` params.
- **Endpoint Tags Section:** Collapsible section showing existing tags (colored pills). "Add Tag" button opens inline form (pattern, tag name, color picker). Delete button on each tag. Wired to `getEndpointTags()`, `createEndpointTag()`, `deleteEndpointTag()`.
- **Results Table:** Professional data table with:
  - Columns: Endpoint (monospace), Method (colored badge — GET=green, POST=blue, PUT=amber, DELETE=red), Status Match (✓/✗ icon), Body Match (✓/✗), Severity (colored dot + label), Risk Score (mini progress bar), Latency Δ, Timestamp (relative — "2m ago")
  - Row hover: highlight with accent glow, cursor pointer
  - Click row → navigate to `/comparison/:requestId`
  - Sticky header
- **Pagination:** Bottom bar with "Showing X–Y of Z" text, page number buttons, prev/next arrows. Wired to `page` and `size` state.
- **Export buttons** in top-right: CSV and PDF (using existing utils)

### 4. Comparison Detail (`/comparison/:requestId`)
**Current:** Full detail view of a single comparison with diff viewer.
**Rebuild as:**
- **Breadcrumb:** "Endpoint Analysis → GET /api/users → Request abc123"
- **Header Card:** Endpoint + Method badge, timestamp, request ID (monospace, copyable), severity badge (large, prominent)
- **Metrics Strip:** 4 mini-cards: Status Match (✓/✗), Body Match (✓/✗), Similarity Score (percentage with ring), Risk Score (gauge)
- **Response Comparison (2 columns):**
  - Left: "Production (v1)" — status code badge, response time, response body in syntax-highlighted code block
  - Right: "Shadow (v2)" — same layout
  - Between them: latency delta indicator (green if shadow is faster, red if slower)
- **Diff Viewer:** Full-width `ReactDiffViewer` component (already imported) showing the JSON diff between prod and shadow bodies. Use dark theme, split view.
- **AI Analysis Card:** If `ai_compared` is true, show: AI Explanation text, Recommended Action (colored badge), Field-level diffs as a collapsible list, Confidence score. Use an "AI sparkle" icon. If not AI-compared, show "Deterministic comparison only" label.
- **Actions Bar:** Bottom sticky bar with "← Back to Analysis", "Export PDF", "Mark as Reviewed" (future-proof placeholder button)
- Wire everything to `getComparison(requestId)`.

### 5. Network Topology (`/topology`)
**Current:** SVG-based node graph showing services and connections.
**Rebuild as:**
- **3D Isometric View:** Wrap the topology in a container with `perspective: 1200px` and `transform: rotateX(8deg) rotateY(-5deg)`. Add mouse-move parallax effect (track cursor position, shift transform slightly).
- **Service Nodes:** Rounded rectangle cards for each service (NGINX, Production API, Shadow API, Comparison Engine, Kafka, Supabase, etc.). Each node has: an icon, service name, status dot (green=healthy, red=down, amber=warning), and a hover tooltip with details.
- **Connection Lines:** Animated dashed SVG paths between nodes. Data flow animation: small dots traveling along the paths (CSS `stroke-dashoffset` animation). Color-coded: green for normal flow, blue for shadow flow, orange for AI analysis flow.
- **Legend:** Bottom-left floating card explaining node types and connection colors.
- **Controls:** Zoom in/out buttons (CSS scale transform), reset view button. Optional: toggle between 3D and flat view.
- Keep reading from `topology-config.json` for node/connection data.

### 6. Quick Setup (`/setup`)
**Current:** AI-powered NGINX configurator with text input.
**Rebuild as:**
- **Stepper Layout:** Visual 3-step horizontal stepper at the top (Step 1: Configure Proxy → Step 2: Start Traffic → Step 3: Monitor). Active step highlighted with accent color, completed steps have check marks. This is visual-only (not multi-form), just gives context.
- **AI Configuration Card (main content):**
  - Large text area with AI icon, placeholder "Tell the AI what you want to configure..."
  - Example prompts as clickable chips below the input: "Route 50% traffic to shadow", "Add /api/v2 as shadow upstream", "Enable request logging"
  - Submit button with loading animation (pulsing glow)
  - Response area: shows the AI's generated config or success message. If it returns NGINX config, render in a code block with syntax highlighting.
- **Quick Reference Sidebar:** Right column (or collapsible panel) with: current proxy status, available endpoints, Docker container status badges (visual placeholders).
- Wire to `configureProxy(instruction)`.

### 7. Website Test (`/website-test`)
**Current:** Form to enter prod/shadow URLs and paths to test.
**Rebuild as:**
- **Test Configuration Card:**
  - Two URL inputs side-by-side: "Production URL" and "Shadow URL" with globe icons
  - Paths input: multi-line textarea or tag-input style (enter a path, it becomes a pill/chip, add more). Default paths pre-filled.
  - "Run Test" button — large, prominent, with animated gradient border on hover
- **Results Panel (appears after test runs):**
  - Per-path result cards: path name, status comparison (prod vs shadow status codes), body match indicator, latency comparison bar chart, expandable diff viewer
  - Overall summary card: X/Y paths passed, average similarity score, overall verdict
  - Loading state: animated progress bar with "Testing /api/users... Testing /api/products..." text cycling
- Wire to `runWebsiteTest({ production_url, shadow_url, paths })`.

### 8. Alerts / Notifications (`/notifications`)
**Current:** Form to configure Slack, email, and webhook notification channels.
**Rebuild as:**
- **Channel Cards (3 columns):** One card per channel type:
  - **Email:** Icon + title, toggle switch (enable/disable), email input field, "Test" button to send test notification
  - **Slack:** Icon + title, toggle switch, webhook URL input, channel name input, "Test" button
  - **Webhook:** Icon + title, toggle switch, URL input, custom headers key-value editor (add/remove rows), "Test" button
- **Trigger Conditions Card:** Below the channels. Checkboxes/toggles for: "Notify on severity ≥ High", "Notify on risk score ≥ 7", "Notify on status code mismatch", "Daily summary digest". Threshold inputs where applicable.
- **Save Configuration** button at bottom — full-width, accent color, loading state on save
- **Recent Alerts Log:** Bottom section, table of last 10 alerts sent (timestamp, channel, trigger reason, status). Placeholder if no alerts yet.
- Wire to `getNotificationConfig()` and `configureNotifications(data)`.

---

## App Shell & Layout (`App.tsx`)

### Sidebar
- **Collapsed/Expanded toggle:** Hamburger icon at top, smooth width animation (260px ↔ 64px). In collapsed mode, show only icons with tooltips on hover.
- **Logo area:** "Shadow API" wordmark + lightning bolt icon. In collapsed mode, show only the icon.
- **Nav items:** Each has an icon (use Lucide React icons or custom SVGs) + label. Active item has: accent-colored left border bar (3px) that slides between items using `framer-motion layoutId`, background highlight, and slightly brighter text.
- **Bottom section:** User avatar circle (first letter of email) + "Sign Out" button. In collapsed mode, just the avatar.
- **Footer:** Version badge "v2.0" — subtle, bottom of sidebar.

### Main Content Area
- Scrollable, with smooth scroll behavior
- `AnimatePresence` wrapping `Routes` for page transitions (fade + slide up on enter, fade out on exit)
- Responsive: on screens < 1024px, sidebar becomes a slide-over drawer with overlay

### Protected Route
- Keep existing Supabase session check logic
- Replace the plain "Loading..." text with a full-screen skeleton pulse animation (show sidebar skeleton + content skeleton shapes)

---

## Global Components to Create

1. **StatCard** — Reusable KPI card with icon, label, value (animated count-up), trend indicator, optional sparkline
2. **SeverityBadge** — Pill component with color based on severity level
3. **MethodBadge** — HTTP method pill (GET=green, POST=blue, PUT=amber, DELETE=red, PATCH=purple)
4. **RiskGauge** — Circular SVG gauge component, animated, color shifts based on value
5. **SkeletonLoader** — Shimmer skeleton for cards, tables, and charts
6. **Toast** — Slide-in notification component (success/error/info variants) with auto-dismiss
7. **DataTable** — Reusable table component with sticky header, hover states, sort indicators, pagination
8. **EmptyState** — Illustration + message + CTA button for when there's no data
9. **GlassCard** — Reusable card with glassmorphism styling
10. **AnimatedNumber** — Count-up animation hook/component for stat values
11. **SearchInput** — Styled search input with icon, clear button, debounced onChange
12. **PageHeader** — Title + description + action buttons layout component

---

## File Structure (New)

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── PageHeader.tsx
│   │   └── ProtectedRoute.tsx
│   ├── ui/
│   │   ├── StatCard.tsx
│   │   ├── SeverityBadge.tsx
│   │   ├── MethodBadge.tsx
│   │   ├── RiskGauge.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── Toast.tsx
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   ├── GlassCard.tsx
│   │   ├── AnimatedNumber.tsx
│   │   └── SearchInput.tsx
│   └── charts/
│       ├── TrendChart.tsx
│       ├── SeverityDonut.tsx
│       └── LatencyBar.tsx
├── hooks/
│   ├── useCountUp.ts
│   └── useMouseParallax.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── OverviewPage.tsx
│   ├── EndpointAnalysisPage.tsx
│   ├── ComparisonDetailPage.tsx
│   ├── TopologyPage.tsx
│   ├── QuickConfigurePage.tsx
│   ├── WebsiteTestPage.tsx
│   └── NotificationsPage.tsx
├── services/
│   ├── api.ts          ← DO NOT MODIFY
│   └── supabase.ts     ← DO NOT MODIFY
├── utils/
│   ├── exportCsv.ts    ← DO NOT MODIFY
│   └── exportPdf.ts    ← DO NOT MODIFY
├── styles/
│   └── index.css       ← Full rebuild
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## Critical Rules

1. **Every existing feature must work identically.** Don't drop any functionality — every button, filter, form, export, nav link, and API call in the current app must exist in the rebuild.
2. **All data fetching stays the same.** Use the exact same functions from `services/api.ts`. Don't refactor the API layer.
3. **Supabase auth flow is unchanged.** Login, sign-up, session check, sign-out — keep the same logic, just make it look better.
4. **No new dependencies** beyond what's already in `package.json` — unless it's a font CDN link or you genuinely need one small utility. Do NOT add Tailwind, Chakra, Material UI, or any CSS framework.
5. **All CSS in `index.css`** or co-located CSS modules. Use CSS variables extensively for the design tokens.
6. **Responsive:** Must work on 1024px+ screens. Sidebar collapses on smaller screens.
7. **Performance:** Lazy-load pages with `React.lazy()` + `Suspense`. Keep bundle lean.
8. **Accessibility:** All interactive elements have focus styles, buttons have aria-labels, color is not the only indicator (always pair with icons/text).
