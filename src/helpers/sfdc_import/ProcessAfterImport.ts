import * as jsforce from 'jsforce';

/**
 * Process data after import to handle any post-import updates
 */
export const processAfterImport = async (
  importResults: any[],
  objectName: string
): Promise<void> => {
  try {
    const successCount = importResults.filter((r: any) => r.success).length;
    const failureCount = importResults.filter((r: any) => !r.success).length;

    console.log(
      `After import processing for ${objectName}: ${successCount} successful, ${failureCount} failed`
    );
  } catch (error) {
    console.error(`Error in processAfterImport for ${objectName}:`, error);
    throw error;
  }
};

/**
 * Re-update custom condition objects (SBQQ rules, etc.)
 */
export const reUpdateCustomConditionObjects = async (
  connection: jsforce.Connection,
  objectsToUpdate: Record<string, any[]>,
  namespace: string
): Promise<void> => {
  try {
    for (const [objectName, records] of Object.entries(objectsToUpdate)) {
      if (records.length > 0) {
        await connection.sobject(objectName).update(records);
        console.log(`Re-updated custom conditions for ${objectName}`);
      }
    }
  } catch (error) {
    console.error('Error re-updating custom condition objects:', error);
    throw error;
  }
};

export default {
  processAfterImport,
  reUpdateCustomConditionObjects,
};
