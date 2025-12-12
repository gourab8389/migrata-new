import * as jsforce from 'jsforce';

/**
 * Get unique field names for an object
 */
export const getUniqueFieldNames = async (
  connection: jsforce.Connection,
  objectName: string,
  namespace: string
): Promise<string[]> => {
  try {
    const query = `
      SELECT ${namespace}UniqueFields__c
      FROM ${namespace}DataObjectConfiguration__c
      WHERE ${namespace}ObjectName__c = '${objectName}'
      LIMIT 1
    `;

    const result = await connection.query(query);
    if (result.records && result.records.length > 0) {
      const fieldsString = (result.records[0] as any)[`${namespace}UniqueFields__c`];
      if (fieldsString) {
        return fieldsString.split(',').map((f: string) => f.trim());
      }
    }

    return [];
  } catch (error) {
    console.error(`Error fetching unique fields for ${objectName}:`, error);
    return [];
  }
};

export default { getUniqueFieldNames };
