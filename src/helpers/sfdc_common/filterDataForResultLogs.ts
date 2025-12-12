/**
 * Filter and format data for result logs
 */
export const filterDataForResultLogs = (data: any): Record<string, any> => {
  const result: Record<string, any> = {};

  // Keep only relevant fields for logging
  const logFields = [
    'Id',
    'Name',
    'Status__c',
    'CreatedDate',
    'LastModifiedDate',
    'insertedRecordCount',
    'updatedRecordCount',
    'failureCount',
    'successCount',
    'errorMessage',
  ];

  for (const field of logFields) {
    if (field in data) {
      result[field] = data[field];
    }
  }

  return result;
};

export default filterDataForResultLogs;
