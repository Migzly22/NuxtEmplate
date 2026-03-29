export type filterType = { label :string, key : string, value : unknown, [key: string]: unknown}


export interface IBaseModel {
    id: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    deletedAt?: string | Date;
}

export type IpcParams = {
    req : Partial<RequestQuery>,
    body : Record<string, unknown>
}

export type RequestQuery = {
    search?:string;
    params?: Record<string, unknown>;
    limit?:number;
    page?:number;
    includes?:string;
    fields?:string;
    paranoid?:string;
    sort?:string;
    paginate?: string;
    date_range?: string;
    others?: unknown;
    scan?:string;
    groupBy?:string
}
