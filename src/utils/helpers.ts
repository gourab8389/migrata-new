import { IMigrationResponse, IErrorResponse } from '../types';

export const successResponse = <T>(
  message: string,
  data?: T
): IMigrationResponse => ({
  success: true,
  message,
  data: data as any,
});

export const errorResponse = (
  message: string,
  statusCode: number = 500
): IErrorResponse => ({
  success: false,
  message,
  statusCode,
});

export const calculatePagination = (page: number = 1, limit: number = 20) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(100, Math.max(1, limit));
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset,
  };
};

export const generateCSVFromArray = (data: any[], headers: string[]): string => {
  const csv = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csv.push(values.join(','));
  });
  
  return csv.join('\n');
};

export const parseQueryString = (query: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const parts = query.split('&');
  
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  
  return params;
};

export const sanitizeSOQL = (soql: string): string => {
  return soql
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/;/g, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateSalesforceId = (id: string): boolean => {
  return /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(id);
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await delay(delayMs * Math.pow(2, attempt));
    }
  }
  throw new Error('Max retries exceeded');
};

export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string | number, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string | number, T[]>);
};

export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, any> => {
  const flattened: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

export const getExecutionTime = (startTime: number): string => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
};

export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

export const waitFor = async (
  condition: () => boolean,
  timeout: number = 10000,
  checkInterval: number = 100
): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) return true;
    await delay(checkInterval);
  }
  
  return false;
};
