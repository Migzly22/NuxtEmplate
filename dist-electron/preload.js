import { contextBridge as o, ipcRenderer as t } from "electron";
o.exposeInMainWorld("biometric", {
  test: () => t.invoke("test"),
  funcCall: async (n, e) => await t.invoke(n, e || {}),
  onUpdate: (n) => {
    const e = (i, r) => n(r);
    return t.on("update-event", e), () => {
      t.removeListener("update-event", e);
    };
  }
});
