import * as jsforce from 'jsforce';

/**
 * Get records from source org
 */
export const getSfdcRecords = async (
  connection: jsforce.Connection,
  objectName: string,
  fields: string[],
  filters?: string
): Promise<any[]> => {
  try {
    let query = `SELECT ${fields.join(', ')} FROM ${objectName}`;
    if (filters) {
      query += ` WHERE ${filters}`;
    }

    const result = await connection.query(query);
    return result.records as any[];
  } catch (error) {
    console.error(`Error fetching records from ${objectName}:`, error);
    return [];
  }
};

/**
 * Get records from source org for migration
 */
export const getSrcOrgRecords = async (
  connection: jsforce.Connection,
  objectName: string,
  fields: string[],
  filters?: string,
  externalIdFilter?: string[]
): Promise<any[]> => {
  try {
    const records = await getSfdcRecords(connection, objectName, fields, filters);

    // Filter by external IDs if provided (QuickDeploy)
    if (externalIdFilter && externalIdFilter.length > 0) {
      return records.filter((r: any) =>
        externalIdFilter.includes(r.Id) || externalIdFilter.includes(r.Name)
      );
    }

    return records;
  } catch (error) {
    console.error(`Error getting source org records from ${objectName}:`, error);
    return [];
  }
};

/**
 * Store document in directory (for attachments/content versions)
 */
export const storeDocumentInDircetory = async (
  fileName: string,
  fileContent: Buffer
): Promise<string> => {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(
      process.env.FILE_LOCATION || './temp',
      fileName
    );

    fs.writeFileSync(filePath, fileContent);
    console.log(`Document stored at ${filePath}`);

    return filePath;
  } catch (error) {
    console.error('Error storing document:', error);
    throw error;
  }
};

export default {
  getSfdcRecords,
  getSrcOrgRecords,
  storeDocumentInDircetory,
};
