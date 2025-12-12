import * as jsforce from 'jsforce';

/**
 * Get migration record update data
 */
export const getMigrationRecordUpdateData = async (
  connection: jsforce.Connection,
  objectName: string,
  namespace: string
): Promise<Record<string, any>> => {
  try {
    const query = `
      SELECT Id, ${namespace}LastUpdateTime__c, ${namespace}LastSyncTime__c
      FROM ${namespace}RecordUpdateInfo__c
      WHERE Name = '${objectName}'
      LIMIT 1
    `;

    const result = await connection.query(query);
    if (result.records && result.records.length > 0) {
      return result.records[0] as any;
    }

    return {};
  } catch (error) {
    console.error(`Error fetching update data for ${objectName}:`, error);
    return {};
  }
};

/**
 * Get migration record update fields
 */
export const getMigrationRecordUpdateFields = async (
  connection: jsforce.Connection,
  objectName: string,
  namespace: string
): Promise<string[]> => {
  try {
    const updateData = await getMigrationRecordUpdateData(connection, objectName, namespace);
    if (updateData.Id) {
      const describe = await connection.describe(objectName);
      return describe.fields
        .filter((f: any) => f.updateable && f.type !== 'reference')
        .map((f: any) => f.name);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching update fields for ${objectName}:`, error);
    return [];
  }
};

export default {
  getMigrationRecordUpdateData,
  getMigrationRecordUpdateFields,
};
