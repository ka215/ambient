# Ambient Vite Development and Build Runbook

Date: 2026-05-10  
Scope: `feature/v2.3.0-vite`

## 1. Purpose

This document defines the operational procedure for Ambient after the Vite asset pipeline introduction.

It covers:

- Local development with Vite dev server
- Apache reverse proxy integration for HMR asset serving
- Production-style build procedure
- Verification points and known caveats

---

## 2. Current Asset Model

### 2-1. Source entries

- JavaScript runtime entry:
  - `src/scripts/ambient.ts`
- CSS entry:
  - `src/styles/app.css`

### 2-2. CSS composition

`src/styles/app.css` imports:

- `src/styles/tailwind.css`
- `views/css/ambient.css`

Note:
- `views/css/ambient.css` is currently kept as a compatibility layer
- future cleanup should migrate its remaining rules into `src/styles/*`

### 2-3. Build outputs

Production build outputs are now:

- `dist/manifest.json`
- `dist/assets/ambient.js`
- `dist/assets/ambient.css`
- `dist/assets/mplus-1p-regular.*`

Legacy outputs such as the following are no longer part of the target production structure:

- `dist/scripts/*`
- `dist/scripts/types/*`
- `dist/tailwindcss.css`
- `dist/tailwindcss.min.css`
- `dist/flowbite.min.js`
- `dist/flowbite.min.css`
- `dist/vendor/sortable.min.js`

---

## 3. Runtime Mode Switching

Ambient switches asset loading in PHP via `functions.php`.

### 3-1. Development mode

When development mode is active:

- `@vite/client` is loaded from the Vite dev server origin
- `src/scripts/ambient.ts` is loaded from `VITE_DEV_SERVER_URL`

### 3-2. Build mode

When build mode is active:

- `dist/manifest.json` is resolved
- JS/CSS are loaded from `dist/assets/*`

### 3-3. Environment variables

Relevant env vars:

- `ASSET_MODE`
  - `dev` or `build`
- `VITE_DEV_SERVER_URL`
  - Example: `https://dev-amp.ka2.org/vite`

Recommended local dev setting:

```env
ASSET_MODE=dev
VITE_DEV_SERVER_URL=https://dev-amp.ka2.org/vite
```

Recommended production-style verification setting:

```env
ASSET_MODE=build
```

`VITE_DEV_SERVER_URL` may remain defined, but `ASSET_MODE=build` should take precedence during build verification.

---

## 4. Local Development Procedure

### 4-1. Preconditions

- Apache local vhost is available at:
  - `https://dev-amp.ka2.org/`
- Node dependencies are installed
- Vite dev server is started locally on:
  - `127.0.0.1:5174`

### 4-2. Start commands

Run:

```bash
npm run dev
```

Optional checks:

```bash
npm run typecheck
npm run build
```

### 4-3. Access pattern

Do not use Vite root directly as the app URL.

- Not the main app URL:
  - `http://localhost:5174/`
- Correct app URL:
  - `https://dev-amp.ka2.org/`

Expected asset requests during dev:

- `https://dev-amp.ka2.org/@vite/client`
- `https://dev-amp.ka2.org/vite/src/scripts/ambient.ts`

---

## 5. Apache Reverse Proxy Requirements

Vite is currently expected to run behind the local Apache HTTPS vhost.

### 5-1. Required proxy routes

At minimum, these routes must be proxied to `http://127.0.0.1:5174/`.

- `/vite/`
- `/@vite/`
- `/src/`
- `/node_modules/`

### 5-2. WebSocket upgrade

HMR websocket requires explicit upgrade forwarding.

Typical rule shape:

```apache
RewriteEngine On
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteRule ^/vite/(.*)$ ws://127.0.0.1:5174/$1 [P,L]
```

### 5-3. Operational note

Current status:

- JS/CSS loading works
- HMR websocket may still disconnect after some idle time

Impact:

- Manual UI verification is still possible
- hot reload may become unstable

This is not currently treated as a blocker for ongoing UI or build work.

---

## 6. Production Build Procedure

### 6-1. Build command

Run:

```bash
npm run build
```

### 6-2. Expected result

After build:

- `dist/` should contain only:
  - `manifest.json`
  - `assets/*`

Because `emptyOutDir: true` is enabled, legacy `dist` artifacts are removed during build.

### 6-3. Required verification

After build, verify:

1. `dist/manifest.json` exists
2. `dist/assets/ambient.js` exists
3. `dist/assets/ambient.css` exists
4. font assets are emitted
5. PHP app loads correctly with `ASSET_MODE=build`

---

## 7. Recommended Verification Flow

### 7-1. Development-mode verification

1. Set:

```env
ASSET_MODE=dev
VITE_DEV_SERVER_URL=https://dev-amp.ka2.org/vite
```

2. Start Vite:

```bash
npm run dev
```

3. Open:

```text
https://dev-amp.ka2.org/
```

4. Confirm:

- base UI renders
- drawers and modal styles are correct
- playlist mode UI works
- local media playback works

### 7-2. Production-style verification

1. Set:

```env
ASSET_MODE=build
```

2. Build:

```bash
npm run build
```

3. Reload Ambient

4. Confirm:

- no Vite dev URLs are requested
- assets load from `dist/assets/*`
- no style regression exists
- local media and YouTube playback still work

---

## 8. E2E Status

Current known status after Vite migration:

- typecheck: pass
- build: pass
- major E2E flows: pass

Note:
- a full Playwright run may still occasionally show a teardown-only flaky result in Chrome
- isolated rerun of the affected scenario has passed
- this is currently treated as infrastructure-level flakiness, not a functional regression

---

## 9. Known Caveats

### 9-1. Compatibility CSS still exists

`views/css/ambient.css` is still imported into the Vite bundle.

Meaning:

- migration is operationally valid
- style ownership is not fully consolidated yet

### 9-2. HMR websocket is not fully stable

If websocket disconnects:

- UI verification can continue
- page reload may be needed instead of full hot reload

### 9-3. Production should not depend on Vite dev server

Production-style operation must use:

- `ASSET_MODE=build`
- `dist/manifest.json`
- `dist/assets/*`

Never rely on:

- `/vite/*`
- `@vite/client`
- `src/scripts/ambient.ts`

in production deployment.

---

## 10. Recommended Next Actions

1. Run production-style verification with `ASSET_MODE=build`
2. Confirm no visual regressions between dev/build modes
3. After validation, commit the Vite migration set
4. Later, split compatibility CSS out of `views/css/ambient.css`
5. Later, stabilize Apache websocket/HMR behavior if needed
