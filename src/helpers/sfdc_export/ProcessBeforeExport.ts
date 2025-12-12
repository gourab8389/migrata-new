import * as jsforce from "jsforce";

interface ProcessExportOptions {
  namespace: string;
  objectName: string;
  mongoRecords: any[];
  targetOrgRecords: any[];
  externalIdName: string;
  auditFieldsEnabled: boolean;
}

/**
 * Process data before export to target org
 * Maps IDs, applies audit fields, separates inserts from updates
 */
export const processBeforeExport = async (
  records: any[],
  options: ProcessExportOptions
): Promise<{
  inserts: any[];
  updates: any[];
}> => {
  const { namespace, objectName, externalIdName, auditFieldsEnabled } = options;
  const inserts: any[] = [];
  const updates: any[] = [];

  try {
    for (const record of records) {
      const cleanRecord = { ...record };
      delete cleanRecord.attributes;
      delete cleanRecord.Id;

      // Check if record exists in target org by external ID
      const externalId = cleanRecord[externalIdName];
      const targetRecord = options.targetOrgRecords.find(
        (r) => r[externalIdName] === externalId
      );

      if (targetRecord) {
        // Update existing record
        cleanRecord.Id = targetRecord.Id;

        // Add audit fields if enabled
        if (auditFieldsEnabled) {
          cleanRecord[`${namespace}SourceId__c`] = record.Id;
          cleanRecord[`${namespace}LastMigratedDate__c`] = new Date();
        }

        updates.push(cleanRecord);
      } else {
        // Insert new record
        // Add audit fields if enabled
        if (auditFieldsEnabled) {
          cleanRecord[`${namespace}SourceId__c`] = record.Id;
          cleanRecord[`${namespace}LastMigratedDate__c`] = new Date();
        }

        inserts.push(cleanRecord);
      }
    }

    console.log(
      `Processed ${objectName}: ${inserts.length} inserts, ${updates.length} updates`
    );

    return { inserts, updates };
  } catch (error) {
    console.error(`Error processing before export for ${objectName}:`, error);
    throw error;
  }
};

/**
 * Check if a record needs updating (has changes)
 */
export const checkRecordBeforeUpdate = (
  sourceRecord: any,
  targetRecord: any,
  fieldsToCompare: string[]
): boolean => {
  for (const field of fieldsToCompare) {
    const sourceValue = sourceRecord[field] ?? "#N/A";
    const targetValue = targetRecord[field] ?? "#N/A";

    if (sourceValue !== targetValue) {
      return true;
    }
  }
  return false;
};

export default {
  processBeforeExport,
  checkRecordBeforeUpdate,
};
