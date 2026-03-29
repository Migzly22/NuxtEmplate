
import { type Order, type WhereOptions,
    type BaseError,
    type UniqueConstraintError,
    type ValidationErrorItem,
    DatabaseError, 
    ValidationError, 
    ValidationErrorItemType, 
    Op, 
    Sequelize 
} from "sequelize";

export type IncludeType = {
    association?: string;
    include?: Array<IncludeType>
}

export type CommonType = { [x: string | symbol]: any }
export type RequestQuery = {
    search?:string;
    params?: Record<string, any>;
    limit?:number;
    page?:number;
    includes?:string;
    fields?:string;
    paranoid?:string;
    sort?:string;
    paginate?: string;
    date_range?: string;
    others?: any;
    scan?:string;
    groupBy?:string
}

export type QueryOptions = {
    where?:WhereOptions<any>;
    limit?:number;
    offset?:number;
    attributes?: Array<string>;
    order?:Order;
    paranoid?:boolean;
    includes?:Array<string | IncludeType>;
}


export type ResponseType = {
    success: boolean;
    error?: number;
    statusCode?: number;
    errorMessage?: string,
    errorDescription?:string
    response?: object,
    version?: string,
    errors?: string[]
}


/**
 * Extracts query field and its corresponding value based on the provided string.
 * This function handles various data types like dates, booleans, and wildcards.
 *
 * @param {string} field - Field name along with its value and type (e.g., `createdAt:2021-10-10:Date`).
 * @returns {CommonType | null} - A key-value pair to be used in the Sequelize query or `null` if invalid.
 */
function getQueryField(field: string) {
    const pair = field.split(":");
    const dataType = pair[2];
    let fieldKey = null,
        fieldValue = null;

    // Handle different data types for filtering
    switch (dataType) {
        case "Date": // Date filtering
            fieldKey = pair[0];
            fieldValue = {
                [Op.gte]: pair[1] + "T00:00:00.000+08:00",
                [Op.lt]: pair[1] + "T23:59:59.000+08:00",
            };
            break;

        case "Boolean": // Boolean filtering
            fieldKey = pair[0];
            fieldValue = pair[1] === "true";
            break;

        default: // Wildcard, integer, or string
            if (!pair[1]) return null;
            if (pair[1].startsWith(".*") && pair[1].endsWith(".*")) {
                fieldKey = pair[0];
                fieldValue = {
                    [Op.iLike]: pair[1].replace(/\.\*/g, '%')
                };
            } else if (!isNaN(+pair[1])) {
                fieldKey = pair[0];
                fieldValue = parseInt(pair[1]);
            } else {
                fieldKey = pair[0];
                fieldValue = pair[1];
            }
    }
    return { [fieldKey]: fieldValue === "null" ? null : fieldValue };
}


/**
 * Constructs a Sequelize query object based on the provided request query.
 * This function dynamically builds the `where` clause, allows for sorting,
 * pagination, field selection, and includes related models.
 *
 * @param {RequestQuery} query - The incoming request query parameters.
 * @returns {QueryOptions} - Returns a Sequelize query options object to be used for querying the database.
 */
export function ConstructQuery(query: RequestQuery): QueryOptions {
    const options: QueryOptions = {}

    // Build the 'where' clause if search conditions are provided.
    if (query.search) {
        let where: CommonType = {};
        const pairs = query.search.split(',');
        
        // Handle logical OR, AND, NOT conditions and NOT NULL checks
        pairs.forEach((field) => {
            if(field.indexOf('$')>-1){
                // do nothing to be injected in the include options
            }else if (field.indexOf("|") > -1) {
                // Handle "OR" condition
                if (!where.hasOwnProperty(Op.or)) where[Op.or] = [];
                const orFields = field.split("|");
                orFields.forEach((orField) => {
                    const _field = getQueryField(orField);
                    if (_field) where[Op.or].push(_field);
                });
            } else if (field.indexOf("&") > -1) {
                // Handle "AND" condition
                if (!where.hasOwnProperty(Op.and)) where[Op.and] = [];
                const andFields = field.split("&");
                andFields.forEach((andField) => {
                    const _field = getQueryField(andField);
                    if (_field) where[Op.and].push(_field);
                });
            } else if (field.indexOf("!") > -1) {
                // Handle "NOT" condition
                const notField = field.replace("!", "");
                const _field = getQueryField(notField);
                if (_field) {
                    where[Op.not] = { ...where[Op.not], ..._field };
                }
            } else if (field.indexOf("?") > -1) {
                // Handle NOT NULL condition
                const notNullField = field.replace("?", "");
                where[notNullField] = { [Op.ne]: null };  // Add condition to check NOT NULL
            } else {
                // Handle standard fields
                const _field = getQueryField(field);
                where = { ...where, ..._field };
            }
        });
        
        // Handle date range filters if provided
        if (query.date_range) {
            const date_ranges = query.date_range.split(",");
            date_ranges.forEach((date_range) => {
                const pair = date_range.split(":");
                const date_query: CommonType = {};
                if (pair[1]) date_query[Op.gte] = new Date(pair[1] + "T00:00:00.000+08:00");
                if (pair[2]) date_query[Op.lt] = new Date(pair[2] + "T23:59:59.000+08:00");
                where[pair[0]] = date_query;
            });
        }
        
        // For full-text search if `scan` parameter is provided
        if (query.scan) {
            where['_search'] = { [Op.match]: Sequelize.fn('phraseto_tsquery', query.scan) }
        }
        
        options.where = where;
        
    }

    // If search is not present but full-text search (`scan`) is, apply it.
    if (!query.search && query.scan) {
        const where: CommonType = {};
        where['_search'] = { [Op.match]: Sequelize.fn('phraseto_tsquery', query.scan) }
        options.where = where;
    }

    // Handle pagination with limit and offset.
    if (query.paginate !== "false") {
        options.limit = query.limit ? query.limit : 5;
        options.offset = query.page ? (query.page - 1) * options.limit : 0;
    }

    // Handle field selection if `fields` parameter is present.
    if (query.fields) {
        const fields = query.fields.split(',');
        options.attributes = fields;
    }

    // Handle sorting of results by fields if `sort` is provided.
    if (query.sort) {
        const sortOptions: any = [];
        const fields = query.sort.split(',');
        fields.forEach(field => {
            const orders = field.split(':');
            sortOptions.push(orders);
        });
        options.order = sortOptions;
    }

    // Handle model inclusion (eager loading) with nested relationships.
    if (query.includes) {
        const data = query.includes.split(',');
        const includes: Array<any> = []

        const toplevel: Array<any> = data.filter(el => el.indexOf('.') === -1);
        toplevel.forEach(top=>{
            const association:{association:string, through?:any, where?:any, required:boolean} = {association: top, required:false}
            // inject where clause for associated model
            if(query.search){
                const queries = query.search.split(',');

                // belongsToMany - $
                let injectable = queries.find(q=>q.indexOf('$')>-1 && q.indexOf(top)>-1)
                if(injectable){
                    injectable = injectable.replaceAll('$','')
                    const nested = injectable.split('.')
                    const pair = (nested[1]|| '').split(':')
                    const associationkey = pair[0] as keyof typeof association
                    association.through = {where:{}}
                    let value = pair[1]
                    
                    // dirty workaround for array element splitting issue
                    if(pair[1] && pair[1].indexOf('[')>-1 && pair[1].indexOf(']')>-1  && pair[1].indexOf(';')>-1){
                        if(value) {
                            value = JSON.parse(value.replaceAll(';',','))
                        }
                    }else if(pair[1]) {
                        value = JSON.parse(pair[1])
                    }

                    association.through.where[associationkey] = value
                    association.required = true
                }

                // belongsTo - @
                let _injectable = queries.find(q=>q.indexOf('@')>-1 && q.indexOf(top)>-1)
                if(_injectable){
                    _injectable = _injectable.replaceAll('@','')
                    const nested = _injectable.split('.')
                    const pair = (nested[1] || '').split(':')
                    const associationkey = pair[0] as keyof typeof association
                    association.where = {}
                    let value = pair[1]
                    
                    // dirty workaround for array element splitting issue
                    if(pair[1] && pair[1].indexOf('[')>-1 && pair[1].indexOf(']')>-1  && pair[1].indexOf(';')>-1){
                        if(value) {
                            value = JSON.parse(value.replaceAll(';',','))
                        }
                    }else if(pair[1]) {
                        value = JSON.parse(pair[1])
                    }

                    association.where[associationkey] = value
                    association.required = true
                }
            }
            includes.push(association)
        })
        
        const nested = data.filter(el => el.indexOf('.') > -1);
        // Handle nested includes using a dot notation (e.g., `user.profile`).
        nested.forEach(nest => {
            const keypair = nest.split('.');
            const records: Array<any> = [];
            for (let i = keypair.length - 1; i >= 0; i--) {
                records.push({ include: [{ association: keypair[i]?.trim() }] });
            }
            let temp;
            for (let i = 0; i < records.length - 1; i++) {
                records[i + 1].include[0].include = records[i].include[0];
                temp = records[i + 1].include[0];
            }
            includes.push(temp);
        });
        options.includes = includes;
    }

    // Soft delete flag (paranoid) control
    if(query.paranoid){
        options.paranoid = query.paranoid !== "false"; // Default is true unless explicitly set to false.
    }

    return options;
}


/**
 * A helper function to structure a successful response.
 *
 * @param {any} response - Data to include in the response.
 * @returns {ResponseType} - An object with success status and response data.
 */
export function ResponseHelper(response?: any): ResponseType {
    const res: ResponseType = {
        success: true,
        response: response
    }
    return res;
}

/**
 * Handles errors and constructs an error response based on the type of error (Sequelize, database, or validation).
 *
 * @param {UniqueConstraintError | BaseError | Error | any} error - The error encountered during execution.
 * @returns {ResponseType} - Returns a structured error response with error codes and messages.
 */
export function ErrorResponseHandler(
    error: UniqueConstraintError
        | BaseError
        | Error
        | any): ResponseType {
    const res: ResponseType = { success: false }

    // Handle validation errors
    if (error instanceof ValidationError) {
        res.error = 1001;
        res.statusCode = 422;
        res.errorMessage = error.message;
        res.errorDescription = error.errors[0]?.message;
        res.errors = constructErrors(error.errors);
    } else if (error instanceof DatabaseError) {
        // Handle database errors
        res.error = 1002;
        res.statusCode = 500;
        res.errorMessage = error.message;
    } else if (error instanceof ErrorHandler) {
        // Handle custom errors
        res.error = 1003;
        res.statusCode = error.statusCode;
        res.errorMessage = error.message;
    } else if (error instanceof Error) {
        // Handle generic errors
        res.error = 1003;
        res.statusCode = 500;
        res.errorMessage = error.message;
    }

    return res;
}

/**
 * Constructs an array of error messages from Sequelize's `ValidationErrorItem`.
 *
 * @param {ValidationErrorItem[]} errors - An array of Sequelize validation error items.
 * @returns {string[]} - An array of error messages.
 */
function constructErrors(errors: ValidationErrorItem[]): string[] {
    const _errors: string[] = [];
    const error_types = Object.keys(ValidationErrorItemType);

    errors.forEach((error) => {
        switch (error.type?.toLowerCase()) {
            case error_types[0]: // NotNull violation
                _errors.push(`${error.path} is required.`);
                break;

            case error_types[2]: // Unique constraint violation
                _errors.push(`${error.path} must be unique.`);
                break;

            case error_types[1]: // String violation
            case error_types[3]: // Validation error
            default:
                _errors.push(error.message);
                break;
        }
    });
    return _errors;
}

export default class ErrorHandler extends Error {
    
    statusCode: number | undefined

    constructor(message?: string, statusCode?: number) {
        super(message)
        this.statusCode = statusCode
    }
}


export const matchRoute = (pattern: string, path: string) => {
  // Convert pattern to regex (e.g., /:id -> /(\d+))
  const regexPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/:id/g, '(-?\\d+)')  
    .replace(/:(\w+)/g, '([^/]+)')
  
  const regex = new RegExp(`^${regexPattern}$`)
  const match = path.match(regex)
  
  if (!match) return null
  
  // Extract parameters
  const paramNames = (pattern.match(/:([\w]+)/g) || []).map(p => p.slice(1))
  const params: any = {}
  
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]
  })
  
  return params
}