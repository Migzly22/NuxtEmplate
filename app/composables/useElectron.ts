import type { IpcParams } from "#shared/types/models"

export type funcCallParam = {
  funcName : string,
  queryPayload ?: IpcParams
}

export const useElectron = () => {
  const test = async () => {
    if(!window.nuxtE) {
      console.error('window.biometric is undefined')
      throw new Error('Electron API not available')
    }
  }
  const funcCall = async (funcName : string, queryPayload ?: Partial<IpcParams>) => {
    if(!window.nuxtE) {
      throw new Error('Electron API not available')
    }
    const result = await window.nuxtE.funcCall(funcName, queryPayload);
    if(result.success === true) {
      return result.response
    } else {

      throw new Error(result.errorMessage)
    }
  }
  return { test, funcCall }
}