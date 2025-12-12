import * as jsforce from 'jsforce';

/**
 * Delete all records of an object in target org
 */
export const deleteAllAndInsertAll = async (
  connection: jsforce.Connection,
  objectName: string
): Promise<{ deleteCount: number; error?: string }> => {
  try {
    // Query all records
    const query = `SELECT Id FROM ${objectName}`;
    const result = await connection.query(query);
    const records = result.records as any[];

    if (records.length === 0) {
      return { deleteCount: 0 };
    }

    // Delete in batches - jsforce.destroy expects array of strings (IDs only)
    const idsToDelete = records.map((r) => r.Id) as string[];
    const deleteResult = await connection.sobject(objectName).destroy(idsToDelete);

    console.log(`Deleted ${records.length} records from ${objectName}`);
    return { deleteCount: records.length };
  } catch (error: any) {
    console.error(`Error deleting records from ${objectName}:`, error);
    return { deleteCount: 0, error: error.message };
  }
};

export default deleteAllAndInsertAll;
