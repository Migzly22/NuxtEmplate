import { app as i, ipcMain as y, BrowserWindow as S } from "electron";
import * as u from "fs";
import { existsSync as g, readFileSync as b, copyFileSync as L } from "fs";
import * as v from "path";
import { join as s } from "path";
import { pathToFileURL as $ } from "url";
const w = i.isPackaged, R = process.platform === "win32" ? i.getPath("userData") : process.resourcesPath, D = w ? R : process.cwd(), p = v.join(D, "logs"), W = v.join(p, "debug.log");
try {
  u.existsSync(p) || u.mkdirSync(p, { recursive: !0 });
} catch (r) {
  console.error(`Failed to create log directory: ${p}`, r);
}
const P = (r, t) => {
  const o = `[${(/* @__PURE__ */ new Date()).toISOString()}][${t}] ${r}
`;
  w ? u.appendFileSync(W, o) : console.warn(o);
}, a = {
  log: (r) => P(r, "LOG"),
  warn: (r) => P(r, "WARN"),
  error: (r) => P(r, "ERROR")
};
a.log("App starting...");
class x {
  nitroPort = 3e3;
  isProd = !1;
  pathLocation;
  initPath;
  nitroServer;
  preloadPath;
  databasePath;
  constructor({ isProd: t, pathLocation: e, nitroPort: o, initPath: n }) {
    this.isProd = t, this.pathLocation = e, this.nitroPort = o, this.initPath = n, this.preloadPath = t ? s(e, "app.asar", "dist-electron", "preload.js") : s(e, "dist-electron", "preload.js");
  }
  getNitroPort = () => this.nitroPort;
  getNitroServer = () => this.nitroServer;
  getPreloadPath = () => this.preloadPath;
  init = async () => {
    try {
      await this.initializedDB(), await this.startWebServer();
    } catch (t) {
      a.error(`${t}`);
    }
  };
  loadEnv = async () => {
    try {
      const t = this.isProd ? s(this.pathLocation, "app.asar.unpacked", "env-file") : s(process.cwd(), "env-file");
      if (g(t)) {
        const o = b(t, "utf8").split(`
`);
        for (const n of o) {
          const [c, ...l] = n.split("=");
          c && !c.startsWith("#") && (process.env[c.trim()] = l.join("=").trim());
        }
      }
    } catch (t) {
      a.error(`Error loading env file: ${t}`);
    }
  };
  initializedDB = async () => {
    try {
      const t = s(this.isProd ? this.initPath : process.cwd(), "logs"), e = this.isProd ? s(this.pathLocation, "app.asar.unpacked", "data.db") : s(process.cwd(), "data.db");
      if (this.isProd) {
        const o = s(this.initPath, "data.db");
        g(o) || L(e, o);
      }
      await this.loadEnv(), this.databasePath = s(this.isProd ? this.initPath : process.cwd(), "data.db"), process.env.DB_STORAGE_PATH = this.databasePath, process.env.LOGS_PATH = t, process.env.TEMPLATE_PATH = this.isProd ? s(this.pathLocation, "app.asar.unpacked") : s(process.cwd()), process.env.NITRO_PORT = `${this.nitroPort}`;
    } catch (t) {
      a.error(`InitializedDB : ${t}`);
    }
  };
  startWebServer = async () => {
    if (!this.isProd) return;
    const t = this.pathLocation;
    try {
      const e = this.isProd ? s(t, "app.asar", ".output", "server", "index.mjs") : s(t, ".output", "server", "index.mjs"), o = $(e).href, { default: n } = await import(o);
      if (typeof n == "function") {
        const c = await n(), l = c.address(), f = typeof l == "string" ? l : l?.port;
        return a.log(`Listening to port ${f}`), this.nitroServer = c, this.nitroPort = f, this.nitroServer;
      } else
        return a.log("Nuxt SSR server loaded (auto-started on import)"), n;
    } catch (e) {
      throw a.error(`Failed to start web server: ${e}`), e;
    }
  };
  stopWebServer = async () => {
    if (this.nitroServer)
      try {
        typeof this.nitroServer?.close == "function" && (await new Promise((t, e) => {
          this.nitroServer?.close((o) => {
            o ? e(o) : t(void 0);
          });
        }), a.log("Nuxt SSR server stopped"));
      } catch (t) {
        a.log(`Error stopping web server: ${t}`);
      } finally {
        this.nitroServer = null;
      }
  };
}
function F() {
  y.handle("test", async () => {
    try {
      return { success: !0, data: "Success" };
    } catch (r) {
      return console.error("Error on IPC:", r), { success: !1, error: r.message };
    }
  });
}
const I = () => {
  F();
}, m = i.isPackaged, T = m ? process.resourcesPath : process.cwd();
let d = null;
const h = new x({
  isProd: m,
  pathLocation: T,
  nitroPort: 3e3,
  initPath: process.platform === "win32" ? i.getPath("userData") : process.resourcesPath
});
process.platform === "win32" && i.setAppUserModelId(i.getName());
i.requestSingleInstanceLock() || (i.quit(), process.exit(0));
const k = async () => {
  const r = h.getNitroPort(), t = h.getPreloadPath();
  d = new S({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: !0,
    webPreferences: {
      preload: t,
      nodeIntegration: !0,
      contextIsolation: !0,
      sandbox: !1
    }
  });
  const e = `http://localhost:${r}`;
  d.loadURL(e), d.webContents.on("before-input-event", (o, n) => {
    n.key === "F12" && d?.webContents.toggleDevTools();
  }), d.webContents.on("did-finish-load", () => {
    d?.webContents.executeJavaScript('console.log("Window electron API:", window.biometric);');
  });
};
i.whenReady().then(async () => {
  await h.init(), k();
});
i.on("window-all-closed", () => {
  h.stopWebServer().then(() => i.quit());
});
I();
