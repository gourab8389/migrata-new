import * as jsforce from "jsforce";

interface InsertResult {
  id?: string;
  success: boolean;
  errors: any[];
  created: boolean;
}

/**
 * Process data after successful export to target org
 * Updates junction tables with ID mappings for newly created records
 */
export const processAfterExport = async (
  insertResults: InsertResult[],
  sourceRecords: any[],
  targetConnection: jsforce.Connection,
  options: {
    namespace: string;
    objectName: string;
    externalIdName: string;
  }
): Promise<{
  idMappings: Record<string, string>;
  failureCount: number;
}> => {
  const { objectName, externalIdName } = options;
  const idMappings: Record<string, string> = {};
  let failureCount = 0;

  try {
    for (let i = 0; i < insertResults.length; i++) {
      const result = insertResults[i];
      const sourceRecord = sourceRecords[i];

      if (result.success && result.id && sourceRecord) {
        // Map source ID to target ID
        const externalId = sourceRecord[externalIdName];
        idMappings[sourceRecord.Id] = result.id;

        console.log(
          `Mapped ${objectName} record: Source=${sourceRecord.Id}, Target=${result.id}, ExtId=${externalId}`
        );
      } else {
        failureCount++;
        console.error(
          `Failed to insert ${objectName} record:`,
          result.errors
        );
      }
    }

    console.log(
      `Processed ${objectName} exports: ${insertResults.length - failureCount} successful, ${failureCount} failures`
    );

    return {
      idMappings,
      failureCount,
    };
  } catch (error) {
    console.error(`Error processing after export for ${objectName}:`, error);
    throw error;
  }
};

/**
 * Update junction table with new ID mappings
 */
export const updateJunctionTable = async (
  idMappings: Record<string, string>,
  objectName: string,
  sourceOrgName: string,
  externalIdName: string
): Promise<void> => {
  try {
    // In a real implementation, this would update Prisma JunctionTable model
    // For now, just log the mappings
    console.log(`Updating junction table for ${objectName}:`);
    for (const [sourceId, targetId] of Object.entries(idMappings)) {
      console.log(
        `  ${sourceId} -> ${targetId} (ExtId: ${externalIdName})`
      );
    }
  } catch (error) {
    console.error("Error updating junction table:", error);
    throw error;
  }
};

export default {
  processAfterExport,
  updateJunctionTable,
};
