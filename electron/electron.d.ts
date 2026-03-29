import type { IpcParams } from "../../shared/types/models"

export type TFuncName = 'fetchBio' | 'createBio' | 'updateBio' | 'fetchLogs'
export interface ElectronAPI {
    test: () => Promise<unknown>;
    funcCall: ( funcName : TFuncName ,ipcParams ?: Partial<IpcParams> ) => Promise<unknown>;
    onUpdate: (data: unknown) => Promise<void>;
}

declare global {
  interface Window {
    nuxtE: ElectronAPI;
  }
}

export {};