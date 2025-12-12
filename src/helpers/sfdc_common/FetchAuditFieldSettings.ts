import * as jsforce from 'jsforce';

/**
 * Fetch audit field settings
 */
export const fetchAuditFieldSettings = async (
  connection: jsforce.Connection,
  namespace: string
): Promise<{
  enabled: boolean;
  fields: string[];
}> => {
  try {
    const query = `
      SELECT ${namespace}AuditFieldsEnabled__c, ${namespace}AuditFields__c
      FROM ${namespace}Settings__c
      LIMIT 1
    `;

    const result = await connection.query(query);
    if (result.records && result.records.length > 0) {
      const record = result.records[0] as any;
      return {
        enabled: record[`${namespace}AuditFieldsEnabled__c`] === true,
        fields: record[`${namespace}AuditFields__c`]?.split(',') || [],
      };
    }

    return { enabled: false, fields: [] };
  } catch (error) {
    console.error('Error fetching audit field settings:', error);
    return { enabled: false, fields: [] };
  }
};

export default { fetchAuditFieldSettings };
