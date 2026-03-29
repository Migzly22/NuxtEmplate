import { contextBridge, ipcRenderer } from 'electron'
import type { IpcParams } from './utils/types';
import type { TFuncName } from './electron.d.ts'


contextBridge.exposeInMainWorld('biometric', {
  test: () => ipcRenderer.invoke('test'),
  funcCall : async ( funcName : TFuncName ,ipcParams ?: IpcParams ) => { return await ipcRenderer.invoke(funcName, ipcParams || {}) },
  onUpdate: (callback: (data: unknown) => void) => {
    const subscription = (_event: unknown, data: unknown) => callback(data);
    ipcRenderer.on('update-event', subscription);
    return () => {
      ipcRenderer.removeListener('update-event', subscription);
    };
  }
})