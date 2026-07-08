# Changelog

All notable changes to this project after the initial GitHub commit.

The initial commit (`c436777` — **Initial Commit**, 26 Jun 2026) established the full Truxy ELD driver app scaffold.

---

## Overview

| # | Commit | Date | Theme |
|---|--------|------|-------|
| 1 | `a6cb295` | 27 Jun 2026 | Build fixes & TypeScript config |
| 2 | `7f79f84` | 29 Jun 2026 | ELD permissions rewrite |
| 3 | `c7aa9cc` | 1 Jul 2026 | Permission & Connect ELD tweaks |
| 4 | `0055e1d` | 4 Jul 2026 | Major architecture refactor |
| 5 | `505f3bc` | 6 Jul 2026 | WebSocket fix + GPS location |
| 6 | `a1b89f4` | 7 Jul 2026 | Elegant UI/UX theme |

---

## [a6cb295] — Resolved build time error in Compliance and EldPermission

**Date:** 27 Jun 2026

Fixed TypeScript/build failures so the app compiles cleanly.

- **Compliance screen** — Resolved type/import errors blocking the build.
- **`EldPermissions.ts`** — Small permission-handling fixes.
- **`tsconfig.json`** — Stricter/correct TS paths and compiler options.
- **`types/env.d.ts`** — Added env variable type declarations (e.g. `BASE_URL`, `WEBSOCKET_URL`).
- **`android/build.gradle`** — Minor Android build config fix.
- **Lockfiles** — `package-lock.json` / `yarn.lock` dependency updates.

---

## [7f79f84] — Reimplemented the logic behind the app permissions

**Date:** 29 Jun 2026

Rebuilt how the app requests and checks ELD-related permissions.

- **`EldPermissions.ts`** — Full rewrite: Bluetooth, location, notifications, and GPS flow with clearer grant/deny handling.
- **`ConnectELD.tsx`** — Wired to the new permission flow before ELD pairing.
- **`PushNotification.ts`** — Aligned FCM setup with permission timing.
- **`AndroidManifest.xml`** — Added/updated permission declarations.
- **`App.js`** — Minor bootstrap change for permission initialization.

---

## [c7aa9cc] — Fix previous minor changes

**Date:** 1 Jul 2026

Follow-up fixes from the permission rewrite.

- **`EldPermissions.ts`** — Further refinements to permission checks and edge cases.
- **`ConnectELD.tsx`** — Improved connect/skip UX and error handling.
- **`App.js`** — Session/permission startup adjustments.
- **`HttpClient.js`** — Small HTTP client fix (headers/base URL handling).

---

## [0055e1d] — Optimize the codebase

**Date:** 4 Jul 2026

Major incremental refactor — new core layer, hooks, offline support, and screen migrations. ~87 files changed (+4,336 / −2,050 lines).

### New architecture (`App/core/`)

| Area | What was added |
|------|----------------|
| **API** | `client.ts`, `legacyClient.ts`, `endpoints.ts`, typed services (`authApi`, `dashboardApi`, `hosApi`, etc.) |
| **Hooks** | `useDashboard`, `useCompliance`, `useRecentChats`, `useNotifications`, `useSession`, `useRealtime`, `useNetworkStatus` |
| **Cache** | In-memory caches for home, compliance, messages, notifications |
| **Session** | `SessionManager`, `sessionStorage`, `loginHelpers`, `eldOnboarding` (post-login Connect ELD gate) |
| **Network** | `networkMonitor`, `requireOnline`, offline detection |
| **Realtime** | Pusher config/auth extracted; `useRealtime` hook replaces scattered Pusher logic |
| **Location** | `formatLocationLabel`, `getDutyStatusLocation` (ELD-based) |

### Removed / migrated

- Deleted legacy `App/Services/Auth.ts`, `Dashboard.ts`, `Settings.ts`
- Deleted monolithic `App/Utils/HttpClient.js` → replaced by `core/api/client.ts` + `legacyClient.ts`
- `Storage.js` → `Storage.ts` (typed AsyncStorage wrapper)

### Redux

- New **Dashboard** slice for home/dashboard state
- **User** reducer updates for session integration

### UI / UX infrastructure

- **NetworkProvider** + **OfflineBanner** — offline awareness across the app
- **NotificationTabIcon** — badge on tab bar
- **apiErrorMessage.ts**, **validators.ts**, **toast.ts** — shared validation and error UX

### Screens updated (migrated to hooks/API layer)

- **Auth:** SignIn, ForgotPassword, OtpVerification, CreateNewPassword
- **Home:** index, ConnectELD, UnsignedLog, DotInspection, Inspection*, Safety*, ApprovalRequestLogs
- **Compliance**, **Messages**, **Notifications**, **Profile**, **Settings**

### Other

- **PushNotification.ts** — Expanded FCM registration and token handling
- **DrawerNavigation** — Initial route set to Connect ELD after login (`eldOnboarding`)
- **package.json** — New dependency for network status monitoring

---

## [505f3bc] — Fixed the websocket connecting issue and fetch location from GPS

**Date:** 6 Jul 2026

Fixed messaging WebSocket 404 and home duty-status location when ELD is not connected.

### WebSocket

- **`.env`** — `WEBSOCKET_URL` corrected (was pointing to a 404 endpoint; restored to working socket URL).
- **MessageWebSocket.ts** — Better error logging; stop reconnecting on permanent failures (404).

### GPS location (duty status)

- **useDutyStatusLocation** — New hook: ELD coordinates when available, device GPS fallback otherwise.
- **DeviceLocation.ts** + **Android native module** (`DeviceLocationModule.kt`, `DeviceLocationPackage.kt`) — GPS + reverse geocoding on Android.
- **getDutyStatusLocation.ts**, **formatLocationLabel.ts**, **parseCoordinates.ts**, **types.ts** — Location parsing and display helpers.
- **Home screen** — Uses fresh coordinates when duty status changes; address/lat-lng no longer stuck at `0,0` or "Location unavailable" without ELD.

---

## [a1b89f4] — Minor changes in UI/UX

**Date:** 7 Jul 2026

Design system and visual polish across major screens.

- **App/Constants/Theme.ts** — New design tokens (colors, spacing, typography, gradients).
- **Colors.js** — Updated palette to match theme.
- **Components:** HomeHeader, AllStatus, HOSDetails, HomeCard, HomeMenuCard, ArcProgressIndicator, OfflineBanner, BottomTab
- **Screens:** Home, ConnectELD (large layout overhaul), Messages, Compliance, Notifications, Auth (SignIn, Welcome), and gradient header consistency on ~15 inspection/safety screens
- **ConnectELD.tsx** — Connect Now button fix (no longer disabled when MAC is empty; validation inside handler); ScrollView, MAC hint, improved layout
- **core/api/client.ts** — Minor API client tweak

---

## Summary by category

| Category | Key outcome |
|----------|-------------|
| **Build / TS** | App compiles; env types; tsconfig fixed |
| **Permissions** | Bluetooth, location, notifications, GPS flows rebuilt |
| **Architecture** | `App/core/` API, hooks, cache, session, network, realtime |
| **Data layer** | Legacy services/HttpClient removed; typed API + Redux Dashboard slice |
| **Session / ELD** | Post-login Connect ELD gate; onboarding skip/connect flow |
| **Offline** | Network monitor, offline banner, require-online guards |
| **Location** | ELD + Android GPS fallback for duty status address/coords |
| **Messaging** | WebSocket URL fix; smarter reconnect behavior |
| **UI/UX** | Theme.ts, consistent gradients, Connect ELD and home polish |
| **Push** | FCM registration and permission timing improvements |

---

## Architecture after refactor

```
App/core/
  api/          endpoints.ts, client.ts, legacyClient.ts, services/*Api.ts
  cache/        homeDataCache, complianceCache, messagesCache, notificationsCache
  hooks/        useDashboard, useCompliance, useRecentChats, useNotifications,
                useSession, useRealtime, useNetworkStatus, useDutyStatusLocation
  session/      SessionManager, sessionStorage, loginHelpers, eldOnboarding.ts
  network/      networkMonitor, requireOnline
  realtime/     pusherConfig, pusherAuth
  location/     formatLocationLabel, getDutyStatusLocation, parseCoordinates, types
App/Services/   Navigation.js only (Auth.ts, Dashboard.ts, Settings.ts deleted)
```

### Environment configuration (current)

```
BASE_URL=https://uat.apnatelelink.us
WEBSOCKET_URL=wss://lms.learningink.com/socket
```