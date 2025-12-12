import * as jsforce from 'jsforce';

/**
 * Fetch external ID field name for an object
 */
export const fetchExtIdName = async (
  connection: jsforce.Connection,
  objectName: string,
  namespace: string
): Promise<string | null> => {
  try {
    // Query the console org for the external ID configuration
    const query = `
      SELECT ${namespace}ExternalIdField__c
      FROM ${namespace}DataObjectConfiguration__c
      WHERE ${namespace}ObjectName__c = '${objectName}'
      LIMIT 1
    `;

    const result = await connection.query(query);
    if (result.records && result.records.length > 0) {
      return (result.records[0] as any)[`${namespace}ExternalIdField__c`] || null;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching external ID for ${objectName}:`, error);
    return null;
  }
};

export default { fetchExtIdName };
