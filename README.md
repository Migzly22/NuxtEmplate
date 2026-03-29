# Nuxt + Electron Template

A desktop template that runs a Nuxt 4 app inside Electron, with TypeScript, Nuxt UI, Tailwind, and Electron packaging via `electron-builder`.

## Tech Stack

- Nuxt 4 (`nuxt`)
- Vue 3 + Vue Router
- TypeScript
- Nuxt UI (`@nuxt/ui`)
- Tailwind CSS 4
- Electron 41
- `nuxt-electron` + `vite-plugin-electron`
- `electron-builder` for distributable installers
- Bun lockfile (`bun.lockb`) is included

## Project Structure

```txt
app/                  Nuxt app (pages, layouts, composables, assets)
electron/             Electron main/preload/ipc/bootstrap code
shared/               Shared types and utilities between app/electron
build/                Electron builder assets (icons, entitlements)
dist-electron/        Built Electron main/preload output
```

## Requirements

- Node.js 20+ recommended
- Bun installed (recommended because build scripts use `bun run ...`)

## Install

```bash
bun install
```

## Usage

### Development

```bash
bun run dev
```

This starts Nuxt dev mode and Electron integration from `nuxt-electron`.

### Build Nuxt

```bash
bun run build
```

### Preview Nuxt (web)

```bash
bun run preview
```

### Generate static output

```bash
bun run generate
```

### Package Desktop App

```bash
# Windows installer
bun run build:win

# macOS package
bun run build:mac
```

## Electron Runtime Modes

This template supports two ways to load the Nuxt UI in Electron:

1. Spawn/boot Nuxt server (current default behavior):
- In production (`app.isPackaged`), `Bootstrap.startWebServer()` imports `.output/server/index.mjs`.
- Electron then loads `http://localhost:<nitroPort>`.
- In development, Electron also loads `http://localhost:3000`.

2. Static file mode (optional, currently commented in `electron/main.ts`):
- Use `BrowserWindow.loadFile(...)` to open `.output/public/index.html`.
- `hashMode: true` is enabled in `nuxt.config.ts`, which helps with file-based routing.

If you want true static desktop rendering, switch to the `loadFile(...)` branch and ensure assets/routes are compatible with generated static output.

## IPC Usage

- Preload bridge exposes Electron APIs with `contextBridge` in `electron/preload.ts`.
- Renderer composable `app/composables/useElectron.ts` uses `window.nuxtE.funcCall(...)`.
- Main process handlers are registered from `electron/ipc/index.ts`.

## Environment and Local Data

`electron/utils/Bootstrap.ts` initializes runtime paths and environment values:

- Reads optional `env-file`
- Sets:
  - `DB_STORAGE_PATH`
  - `LOGS_PATH`
  - `TEMPLATE_PATH`
  - `NITRO_PORT`
- In packaged mode, it can copy `data.db` to a writable app directory if missing.

## Packaging Notes

- Electron entry point: `dist-electron/main.js` (`package.json > main`)
- Packaging config: `electron-builder.yml`
- Includes platform targets for Windows, macOS, and Linux
- Uses ASAR with selected unpacked resources (`data.db`, `env-file`, selected modules)

## Notes

- Router hash mode is enabled in `nuxt.config.ts`.
- DevTools are toggled with `F12` in Electron.
