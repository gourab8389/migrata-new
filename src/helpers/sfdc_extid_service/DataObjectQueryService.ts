import * as jsforce from 'jsforce';

/**
 * Get data object operations configuration
 */
export const getDataObjectOperations = async (
  connection: jsforce.Connection,
  objectNames: string[],
  namespace: string = process.env.MIGRATA_NAMESPACE || ''
): Promise<Record<string, string>> => {
  try {
    const query = `
      SELECT ${namespace}ObjectName__c, ${namespace}Operation__c
      FROM ${namespace}DataObjectConfiguration__c
      WHERE ${namespace}ObjectName__c IN (${objectNames.map((o) => `'${o}'`).join(',')})
    `;

    const result = await connection.query(query);
    const operations: Record<string, string> = {};

    for (const record of result.records) {
      const objName = (record as any)[`${namespace}ObjectName__c`];
      const operation = (record as any)[`${namespace}Operation__c`];
      if (objName && operation) {
        operations[objName] = operation;
      }
    }

    return operations;
  } catch (error) {
    console.error('Error fetching data object operations:', error);
    return {};
  }
};

export default { getDataObjectOperations };
