/**
 * Concatenate unique key fields with delimiter
 */
export const concatUniqueKey = (obj: any, fields: string[], delimiter: string = '~'): string => {
  return fields
    .map(field => obj[field] || '')
    .join(delimiter);
};

export default concatUniqueKey;
