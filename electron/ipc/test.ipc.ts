import { ipcMain } from "electron";

export function testIPC() {
  ipcMain.handle("test", async () => {
    try {
      return { success: true, data: "Success" };
    } catch (error) {
      console.error("Error on IPC:", error);
      return { success: false, error: (error as Error).message };
    }
  });

}