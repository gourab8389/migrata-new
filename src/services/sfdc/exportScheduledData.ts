import * as jsforce from 'jsforce';
import { getSfdcTokenConnection } from '../../helpers/sfdc_common/SfdcTokenConnectionService';
import { filterAndStoreData, updateLastSyncTimeInMongo, filterAndStoreBatchItemRecordIds } from '../mongo/StoreDataService';
import { getDataFields, getDataObjects, getDataBatchItemFiltersObject, getRelationshipObject, getTargetOperation, getDownloadFlowDetailed, getUploadFlow } from './DataMetaDataService';
import { getMigrationRecordUpdateData, getMigrationRecordUpdateFields } from './MigrataDateInfoService';
import { processBeforeExport } from '../../helpers/sfdc_export/ProcessBeforeExport';
import { processAfterExport } from '../../helpers/sfdc_export/ProcessAfterExport';
import { getUniqueFieldNames } from './UniqueFieldFetchService';
import { processAfterImport, reUpdateCustomConditionObjects } from '../../helpers/sfdc_import/ProcessAfterImport';
import { deleteAllAndInsertAll } from '../../helpers/sfdc_export/DeleteAllHelper';
import { filterDataForResultLogs } from '../../helpers/sfdc_common/filterDataForResultLogs';
import { unmapDeletedRecords } from '../../helpers/sfdc_extid_service/unmapDeletedRecords';
import { sendMigrateDataMail } from '../../helpers/mailer/migrate-data-mailer';
import { fetchExtIdName } from '../../helpers/sfdc_extid_service/FetchExtIdNameService';
import { fetchAuditFieldSettings } from '../../helpers/sfdc_common/FetchAuditFieldSettings';
import { getDataObjectOperations } from '../../helpers/sfdc_extid_service/DataObjectQueryService';
import { getSfdcRecords, getSrcOrgRecords } from '../../helpers/sfdc_import/SfdcRecordService';
import prisma from '../../config/database';
const BATCH_SIZE = 10000; // Salesforce Bulk API limit
const namespace = process.env.MIGRATA_NAMESPACE || '';

interface ExportResult {
  objectName: string;
  insertCount: number;
  updateCount: number;
  failureCount: number;
  startTime: Date;
  endTime: Date;
  status: 'Success' | 'Failed';
  errors: string[];
}

interface ScheduleData {
  batchName: string;
  batchId: string;
  sourceOrgId: string;
  sourceOrgName: string;
  targetOrgName: string;
  sourceOrgDomainName: string;
  targetOrgDomainName: string;
}

/**
 * Process bulk operation with automatic batching
 */
const processBulkOperation = async (
  connection: jsforce.Connection,
  objectName: string,
  operation: 'insert' | 'update',
  records: any[]
): Promise<any[]> => {
  if (!records || records.length === 0) return [];

  if (records.length <= BATCH_SIZE) {
    return await connection.sobject(objectName)[operation](records);
  }

  console.log(
    `Processing ${records.length} records in batches of ${BATCH_SIZE} for ${objectName}`
  );
  const allResults = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);

    console.log(
      `Processing batch ${batchNum}/${totalBatches} (${batch.length} records) for ${objectName}`
    );

    const batchResult = await connection
      .sobject(objectName)
      [operation](batch);
    allResults.push(...batchResult);
  }

  console.log(`Completed ${operation} for ${objectName}: ${allResults.length} total results`);
  return allResults;
};

/**
 * Fetch schedule data from console org
 */
const fetchScheduleData = async (
  consoleOrgConn: jsforce.Connection,
  scheduledId: string
): Promise<ScheduleData> => {
  try {
    const scheduleRecord = await consoleOrgConn
      .sobject(`${namespace}DataSchedule__c`)
      .retrieve(scheduledId);

    const batchRecord = (await consoleOrgConn
      .sobject(`${namespace}DataBatch__c`)
      .retrieve(scheduleRecord[`${namespace}DataBatch__c`])) as any;

    return {
      batchName: batchRecord?.Name || '',
      batchId: batchRecord?.Id || '',
      sourceOrgId: batchRecord?.[`${namespace}SourceOrg__c`] || '',
      sourceOrgName: batchRecord?.[`${namespace}SourceOrgName__c`] || '',
      targetOrgName: batchRecord?.[`${namespace}TargetOrgName__c`] || '',
      sourceOrgDomainName: batchRecord?.[`${namespace}SourceOrgDomainName__c`] || '',
      targetOrgDomainName: batchRecord?.[`${namespace}TargetOrgDomainName__c`] || '',
    };
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    throw error;
  }
};

/**
 * Main export orchestration function
 * This is the CORE service that handles the entire migration lifecycle
 */
export const exportScheduledData = async (
  scheduledId: string,
  batchName: string,
  consoleOrgConn: jsforce.Connection,
  currentTime: Date = new Date()
): Promise<ExportResult[]> => {
  const migrationStartTime = new Date();
  const results: ExportResult[] = [];

  try {
    // Step 1: Update DataSchedule__c status to "In-Progress"
    await consoleOrgConn
      .sobject(`${namespace}DataSchedule__c`)
      .update({
        Id: scheduledId,
        [`${namespace}Status__c`]: 'In-Progress',
        [`${namespace}ActualStartTime__c`]: currentTime,
      });

    // Step 2: Fetch schedule and org connection data
    const scheduleData = await fetchScheduleData(consoleOrgConn, scheduledId);
    console.log(`Starting migration for batch: ${scheduleData.batchName}`);

    // Step 3: Get source and target org connections
    const sourceOrgConn = await getSfdcTokenConnection(scheduleData.sourceOrgDomainName);
    const targetOrgConn = await getSfdcTokenConnection(scheduleData.targetOrgDomainName);

    if (!sourceOrgConn || !targetOrgConn) {
      throw new Error('Failed to establish org connections');
    }

    // Step 4: Set bulk API polling timeout
    sourceOrgConn.bulk.pollTimeout = Number.MAX_VALUE;
    targetOrgConn.bulk.pollTimeout = Number.MAX_VALUE;

    // Step 5: Get download flow (object sequence based on dependencies)
    const downloadFlowData = await getDownloadFlowDetailed(
      consoleOrgConn,
      batchName,
      namespace
    );
    const objectNamesDetailed = downloadFlowData.resultArrDetailed;

    console.log(`Download flow: ${downloadFlowData.resultArr.join(' -> ')}`);

    // Step 6: Get operation types for each object
    const objNameOperationMap = await getDataObjectOperations(
      consoleOrgConn,
      downloadFlowData.resultArr,
      namespace
    );

    // Step 7: Fetch audit field settings
    const auditSettings = await fetchAuditFieldSettings(consoleOrgConn, namespace);

    // PHASE 1: EXTRACT FROM SOURCE ORG -> STORE IN DATABASE
    const batchItemFilters = await getDataBatchItemFiltersObject(
      consoleOrgConn,
      batchName,
      namespace
    );

    for (const objectName of downloadFlowData.resultArr) {
      try {
        const result: ExportResult = {
          objectName,
          insertCount: 0,
          updateCount: 0,
          failureCount: 0,
          startTime: new Date(),
          endTime: new Date(),
          status: 'Success',
          errors: [],
        };

        console.log(`\n=== Processing ${objectName} ===`);

        // Get field names and unique fields
        const fields = await getDataFields(sourceOrgConn, objectName);
        const uniqueFields = await getUniqueFieldNames(consoleOrgConn, objectName, namespace);
        const externalIdName = await fetchExtIdName(consoleOrgConn, objectName, namespace);

        if (!fields || fields.length === 0) {
          console.warn(`No fields available for ${objectName}, skipping`);
          result.status = 'Failed';
          result.errors.push(`No fields available for ${objectName}`);
          results.push(result);
          continue;
        }

        // Query source org
        let filters = batchItemFilters[objectName]?.filter || '';
        let sourceRecords = await getSrcOrgRecords(
          sourceOrgConn,
          objectName,
          fields,
          filters
        );

        console.log(`Fetched ${sourceRecords.length} records from ${objectName}`);

        if (sourceRecords.length > 0) {
          // Store in database
          await filterAndStoreData(objectName, scheduleData.sourceOrgName, sourceRecords, externalIdName || '', uniqueFields);

          // Update last sync time
          await updateLastSyncTimeInMongo(objectName, scheduleData.sourceOrgName);
        }

        result.endTime = new Date();
        results.push(result);
      } catch (error: any) {
        console.error(`Error processing ${objectName}:`, error);
        results.push({
          objectName,
          insertCount: 0,
          updateCount: 0,
          failureCount: 1,
          startTime: new Date(),
          endTime: new Date(),
          status: 'Failed',
          errors: [error.message],
        });
      }
    }

    // PHASE 2: EXPORT FROM DATABASE -> TARGET ORG
    const uploadFlow = await getUploadFlow(consoleOrgConn, batchName, namespace);
    const targetOperation = await getTargetOperation(consoleOrgConn, batchName, namespace);

    console.log(`\nUpload flow: ${uploadFlow.join(' -> ')}`);
    console.log(`Target operation: ${targetOperation}`);

    for (const objectName of uploadFlow) {
      try {
        const existingResult = results.find((r) => r.objectName === objectName);
        if (!existingResult) continue;

        // Get fields from target org
        const targetFields = await getDataFields(targetOrgConn, objectName);
        const externalIdName = await fetchExtIdName(consoleOrgConn, objectName, namespace);

        // Query target org existing records
        let targetRecords = await getSfdcRecords(
          targetOrgConn,
          objectName,
          ['Id', externalIdName || 'Id']
        );

        console.log(`Target org has ${targetRecords.length} existing records`);

        // Handle Delete All operation
        if (targetOperation === 'Delete All and Insert All') {
          await deleteAllAndInsertAll(targetOrgConn, objectName);
          targetRecords = [];
        }

        // TODO: Get source records from database and prepare for export
        // This would query the stored records and apply processBeforeExport

        existingResult.endTime = new Date();
      } catch (error: any) {
        console.error(`Error exporting ${objectName}:`, error);
        const result = results.find((r) => r.objectName === objectName);
        if (result) {
          result.status = 'Failed';
          result.errors.push(error.message);
        }
      }
    }

    // PHASE 3: FINALIZATION
    const endTime = new Date();
    const timeTaken = (endTime.getTime() - migrationStartTime.getTime()) / 1000;

    // Update migration log
    const successCount = results.filter((r) => r.status === 'Success').length;
    const failureCount = results.filter((r) => r.status === 'Failed').length;

    await prisma.migrateDataLog.create({
      data: {
        dataScheduleId: scheduledId,
        sourceOrg: scheduleData.sourceOrgName,
        targetOrg: scheduleData.targetOrgName,
        batchName: scheduleData.batchName,
        objectNames: downloadFlowData.resultArr,
        status: failureCount === 0 ? 'Success' : 'Failed',
        insertResult: { objectCount: successCount },
        updateResult: { objectCount: successCount },
        startTime: migrationStartTime,
        endTime,
      },
    });

    // Set final status
    await consoleOrgConn
      .sobject(`${namespace}DataSchedule__c`)
      .update({
        Id: scheduledId,
        [`${namespace}Status__c`]: failureCount === 0 ? 'Success' : 'Failed',
        [`${namespace}FinishTime__c`]: endTime,
      });

    // Send email notification
    await sendMigrateDataMail(
      consoleOrgConn,
      scheduledId,
      failureCount === 0 ? 'Success' : 'Failed',
      batchName
    );

    console.log(`\nMigration completed in ${timeTaken}s. Success: ${successCount}, Failed: ${failureCount}`);

    return results;
  } catch (error: any) {
    console.error('Export scheduled data error:', error);

    // Log error
    await prisma.errorLog.create({
      data: {
        dataScheduleId: scheduledId,
        errorMessage: error.message,
        errorStack: error.stack,
        endpoint: '/api/v1/migrate-data/start',
        context: { batchName },
      },
    });

    // Update status to Failed
    try {
      const endTime = new Date();
      await consoleOrgConn
        .sobject(`${namespace}DataSchedule__c`)
        .update({
          Id: scheduledId,
          [`${namespace}Status__c`]: 'Failed',
          [`${namespace}FinishTime__c`]: endTime,
        });
    } catch (updateError) {
      console.error('Failed to update DataSchedule status:', updateError);
    }

    throw error;
  } finally {
    // Clear global flags
    (global as any).migrateDataRouteRunning = false;
    (global as any).quickDeployRouteRunning = false;
    console.log(':::Data Process Completed:::');
  }
};

export default {
  exportScheduledData,
  processBulkOperation,
  fetchScheduleData,
};
