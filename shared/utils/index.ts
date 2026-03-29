export enum DateFormatType {
  DateOnly = 'dateOnly',
  DateWithTime = 'dateWithTime',
  Numerical = 'numerical',
  MonthDay = 'monthDay',
  YearOnly = 'yearOnly',
  TimeOnly = 'timeOnly',
  Full = 'full',
  DEFAULT = 'default'
}

export const capitalizeFirstLetter = (input: string): string => {
    if (!input) return '';
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
};

export const  formatCurrency = (amount: number, locale: string = 'en-PH', currency: string = 'PHP'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const  formatCurrencyShorten = (amount: number,
  {
    style = 'currency',
    locale = 'en-PH',
    currency = 'PHP',
    shorten = true,
    minimumFractionDigits=  0,
    maximumFractionDigits =  2
  }: {
      style?: string | undefined;
      locale?: string;
      currency?: string;
      shorten?: boolean
      minimumFractionDigits?: number;
      maximumFractionDigits?: number
  } = {}
): string | undefined => {
    const absValue = Math.abs(amount);
    const formatOptions : any = {
      style : style === 'none' ? undefined : style,
      currency: currency,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: maximumFractionDigits
    };

    const ranges = [
      { divisor: 1e12, suffix: 'T' },
      { divisor: 1e9, suffix: 'B' },
      { divisor: 1e6, suffix: 'M' },
      { divisor: 1e3, suffix: 'k' }
    ];
    if(amount < 1e3 ) formatOptions.minimumFractionDigits = 2
    const formatter = new Intl.NumberFormat(locale, formatOptions);
    if(shorten){
      for (const range of ranges) {
        if (absValue >= range.divisor) {
          const amountVal = amount / range.divisor
          const multiplier = Math.pow(10, maximumFractionDigits);
          const floored = Math.floor(amountVal * multiplier) / multiplier;
          return formatter.format(floored) + range.suffix;
        }
      }
    }
    return formatter.format(amount)
}
export const parseFormattedNumber = (value : string, locale = 'en-US') => {
  const formatter = new Intl.NumberFormat(locale);

  const parts = formatter.formatToParts(1234.5);

  const group = parts.find(part => part.type === 'group')?.value || ',';
  const decimal = parts.find(part => part.type === 'decimal')?.value || '.';
  

  const groupRegex = new RegExp(`\\${group}`, 'g');
  const decimalRegex = new RegExp(`\\${decimal}`, 'g');
  let cleaned = value.replace(groupRegex, '');
  cleaned = cleaned.replace(decimalRegex, '.')
        .replace(/[^\d.-]/g, '');
  
  return parseFloat(cleaned);
}



export function formatDate(dateTime: Date | string | null | undefined, formatType: DateFormatType = DateFormatType.DEFAULT, sameYear ?: boolean): string {
  if (!dateTime) return '';

  const date = new Date(dateTime); // Ensures it's a Date instance
  if (isNaN(date.getTime())) return ''; // Invalid date check

  const now = new Date();
  const isSameYear = sameYear ?? now.getFullYear() === date.getFullYear();

  const options: Intl.DateTimeFormatOptions = (() => {
    switch (formatType) {
      case DateFormatType.DateOnly:
        return isSameYear
          ? { month: 'short', day: 'numeric' }
          : { month: 'short', day: 'numeric', year: 'numeric' };

      case DateFormatType.DateWithTime:
        return isSameYear
          ? { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }
          : { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };

      case DateFormatType.Numerical:
        return { year: 'numeric', month: '2-digit', day: '2-digit' };

      case DateFormatType.MonthDay:
        return { month: 'short', day: 'numeric' };

      case DateFormatType.YearOnly:
        return { year: 'numeric' };

      case DateFormatType.TimeOnly:
        return { hour: 'numeric', minute: 'numeric', hour12: true };

      case DateFormatType.Full:
        return {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        };
      default:
        return {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
        }
    }
  })();

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Remove Array Duplication
export const removeArrDuplication = <T extends { id: number }>(
  oldList: T[],
  newList: T[],
  reorder?: keyof T
): T[] => {
  const safeNewList = newList || [];
  const newItemsId = new Set(safeNewList.map(item => item.id));
  
  const filteredOldList = oldList.filter(item => !newItemsId.has(item.id));
  const mergedItems = [...filteredOldList, ...safeNewList];

  if(reorder) {
    return mergedItems.sort((a, b) => {
      const aValue = a[reorder];
      const bValue = b[reorder];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      if (aValue instanceof Date && bValue instanceof Date) {
        return aValue.getTime() - bValue.getTime();
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      return 0;
    });
  }
  
  return mergedItems;
};

export const objToFormData = ( payload : Record<string, unknown>, additionalFiles: File[] = [] ) : FormData => {
    const formData = new FormData();
    for (const key in payload) {
      const value = (payload as any)[key];

      if ((key === 'files' || key === 'attachments') && Array.isArray(value)) {
        // Append files array (if present in payload)
        value.forEach((file: File) => {
          formData.append('files', file);
        });
      } else if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value)); // stringify objects
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    }


    if(additionalFiles.length >= 1){
      additionalFiles.forEach((file) => {
        formData.append('files', file);
      });
    }

    return formData;
}


export const mimeTypeToExtension = (mimeType?: string): string => {
  if (!mimeType) return '';
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    // Add more mappings as needed
  };

  return mimeMap[mimeType] || '';
}

export const parseDateLocal = (dateString : any) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(year, month - 1, day);
};

export const formatFileSize = (bytes : number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024; // Binary (IEC standard)
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));

    return `${formattedValue} ${sizes[i]}`;
}

export const msgFormatter = (msg : string, key : string, value : any) =>  msg.replace(`{{${key}}}`, value)

/**
 * Compares two arrays and returns the differences.
 * @param initial The initial array.
 * @param newValue The new array to compare against.
 * @returns An object with arrays of added and removed items.
 */
export const getArrayDifferences = (initial : number[],  newValue : number[]) => {
    try {
        const initialSet = new Set(initial);
        const newSet = new Set(newValue);

        return {
            add: [...newSet].filter(item => !initialSet.has(item)),
            remove: [...initialSet].filter(item => !newSet.has(item))
        }
    } catch (error) {
        console.error(error)
        return { added : [], removed : [] }
    }
}


export const formatTimeAgo = (dateTime?: Date | string | null) : string => {
  if (!dateTime) return '';

  const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  const now = new Date();
  const difference = now.getTime() - date.getTime();

  if (difference <= 0) return "Just Now";

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30); // Approximation
  const years = Math.floor(days / 365); // Approximation

  if (seconds < 10) return "few seconds ago";
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 2) return "1 min ago";
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 2) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${years} year${years > 1 ? "s" : ""} ago`;
}


// Check and get the added and deleted value on the array
export const crossCheck = (initial : number[],  newValue : number[]) => {
    try {
        const initialSet = new Set(initial);
        const newSet = new Set(newValue);

        return {
            added: [...newSet].filter(item => !initialSet.has(item)),
            removed: [...initialSet].filter(item => !newSet.has(item))
        }
    } catch (error) {
        console.error(error)
        return { added : [], removed : [] }
    }
}

