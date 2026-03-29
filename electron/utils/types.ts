import type { RequestQuery } from "./Helper"

export type IpcParams = {
    req : RequestQuery,
    body : Record<string, unknown>
}

