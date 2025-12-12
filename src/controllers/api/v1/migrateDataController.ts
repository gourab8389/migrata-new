import { Request, Response } from 'express';
import getSfdcTokenConnection from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import { exportScheduledData } from '../../../services/sfdc/exportScheduledData';
import prisma from '../../../config/database';

const namespace = process.env.MIGRATA_NAMESPACE || '';

interface MigrationPayload {
  dataScheduleId: string;
  consoleOrgDomain: string;
  batchName: string;
}

let migrateDataRouteRunning = false;


 // Start data migration between orgs
 // Initiates async background process that exports data from source org,
 // stores in database, and imports to target org

export const startMigration = async (req: Request, res: Response): Promise<void> => {
  try {
    if (migrateDataRouteRunning) {
      res.status(409).json({
        success: false,
        message: 'A migration is already in progress. Please wait for it to complete.',
      });
      return;
    }

    migrateDataRouteRunning = true;
    const payload: MigrationPayload = req.body;
    const { dataScheduleId, consoleOrgDomain, batchName } = payload;

    // Validate input
    if (!dataScheduleId || !consoleOrgDomain || !batchName) {
      migrateDataRouteRunning = false;
      res.status(400).json({
        success: false,
        error: 'Missing required fields: dataScheduleId, consoleOrgDomain, batchName',
      });
      return;
    }

    // Get console org connection
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);
    if (!consoleOrgConn) {
      migrateDataRouteRunning = false;
      res.status(401).json({
        success: false,
        error: 'Failed to establish connection to console org',
      });
      return;
    }

    // Create migration log entry
    const log = await prisma.migrateDataLog.create({
      data: {
        dataScheduleId,
        batchName,
        status: 'Queued',
        startTime: new Date(),
        insertResult: {},
        updateResult: {},
      },
    });

    // Start async migration process (non-blocking)
    // If body contains dataBatchIds -> multi-batch quick deploy
    if (req.body && Array.isArray((req.body as any).dataBatchIds)) {
      // kick off multi-batch processing and return immediately
      (async () => {
        try {
          const dataBatchIds: string[] = (req.body as any).dataBatchIds;
          // Mark globals similar to legacy behavior
          (global as any).migrateDataRouteRunning = false;
          (global as any).quickDeployRouteRunning = true;
          (global as any).totalBatches = dataBatchIds.length;
          (global as any).currentBatchIndex = 0;

          for (let i = 0; i < dataBatchIds.length; i++) {
            (global as any).currentBatchIndex = i + 1;
            const batchId = dataBatchIds[i];
            // fetch batch name
            const batchQuery = `SELECT Name FROM ${namespace}DataBatch__c WHERE Id='${batchId}'`;
            const batchResult: any = await consoleOrgConn.query(batchQuery);
            const currentBatchName = batchResult.records[0]?.Name || `Batch-${batchId}`;

            // update DataSchedule to point to current batch (best-effort)
            try {
              await consoleOrgConn.sobject(namespace + 'DataSchedule__c').update({
                Id: dataScheduleId,
                [namespace + 'DataBatchId__c']: batchId,
                [namespace + 'Status__c']: 'Scheduled',
              });
            } catch (err) {
              console.error('Failed to update DataSchedule for multi-batch:', err);
            }

            try {
              await exportScheduledData(dataScheduleId, currentBatchName, consoleOrgConn, new Date());
            } catch (err) {
              console.error('Error in batch export:', err);
            }
          }
        } catch (err) {
          console.error('Multi-batch migration error:', err);
        } finally {
          (global as any).migrateDataRouteRunning = false;
          (global as any).quickDeployRouteRunning = false;
        }
      })();
    } else {
      // Single batch
      (async () => {
        try {
          const results = await exportScheduledData(
            dataScheduleId,
            batchName,
            consoleOrgConn,
            new Date()
          );

          console.log(`Migration ${dataScheduleId} completed with ${results.length} object results`);
        } catch (err) {
          console.error(`Migration ${dataScheduleId} error:`, err);
        } finally {
          migrateDataRouteRunning = false;
        }
      })();
    }

    res.status(202).json({
      success: true,
      message: 'Migration started',
      dataScheduleId,
      logId: log.id,
      status: 'IN_PROGRESS',
    });
  } catch (error: any) {
    migrateDataRouteRunning = false;
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};

// GET /api/v1/migrate-data/status
export const getMigrationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataScheduleId } = req.query;

    if (!dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.migrateDataLog.findFirst({
      where: { dataScheduleId: String(dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      res.status(404).json({ success: false, error: 'Migration not found' });
      return;
    }

    res.status(200).json({
      success: true,
      dataScheduleId: log.dataScheduleId,
      status: log.status,
      progress: log.progress,
      insertResult: log.insertResult,
      updateResult: log.updateResult,
      errorCount: log.errorCount,
      startTime: log.startTime,
      endTime: log.endTime,
      objectNames: log.objectNames,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};


 // GET /api/v1/migrate-data (legacy compatibility)
 // Accepts `dataScheduleId` as query param and kicks off the same async
 // export process as the old server. Returns a resultUrl for logs.

export const migrate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (migrateDataRouteRunning || (global as any).quickDeployRouteRunning) {
      res.status(409).json({ success: false, message: 'A migration is already in progress.' });
      return;
    }

    (global as any).migrateDataRouteRunning = true;

    if (!req.query.dataScheduleId) {
      (global as any).migrateDataRouteRunning = false;
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const scheduledId = String(req.query.dataScheduleId).replace(/'/g, "\\'");
    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);

    if (!consoleOrgConn) {
      (global as any).migrateDataRouteRunning = false;
      res.status(500).json({ success: false, error: 'Failed to connect to console org' });
      return;
    }

    // fetch schedule metadata and validate
    const query = `SELECT Id, ${namespace}DataBatchId__c, ${namespace}DataBatchId__r.Name, ${namespace}SourceOrg__r.Name, ${namespace}TargetOrg__r.Name, ${namespace}ScheduledStartTime__c, ${namespace}Status__c FROM ${namespace}DataSchedule__c WHERE Id='${scheduledId}'`;
    const scheduleData: any = await consoleOrgConn.query(query);

    if (!scheduleData.records || !scheduleData.records[0]) {
      (global as any).migrateDataRouteRunning = false;
      res.status(404).json({ success: false, error: `No Data Found for ${scheduledId}` });
      return;
    }

    const status = scheduleData.records[0][namespace + 'Status__c'];
    const batchName = scheduleData.records[0][namespace + 'DataBatchId__r']?.Name || '';

    // Upsert a migrateDataLog similar to legacy behavior
    await prisma.migrateDataLog.upsert({
      where: { dataScheduleId: scheduledId },
      update: {
        status: 'Queued',
        batchName,
        sourceOrg: scheduleData.records[0][namespace + 'SourceOrg__r']?.Name || '',
        targetOrg: scheduleData.records[0][namespace + 'TargetOrg__r']?.Name || '',
      },
      create: {
        dataScheduleId: scheduledId,
        status: 'Queued',
        batchName,
        sourceOrg: scheduleData.records[0][namespace + 'SourceOrg__r']?.Name || '',
        targetOrg: scheduleData.records[0][namespace + 'TargetOrg__r']?.Name || '',
        insertResult: {},
        updateResult: {},
      },
    });

    // Kick off async export
    (async () => {
      try {
        await exportScheduledData(scheduledId, batchName, consoleOrgConn, new Date());
      } catch (err) {
        console.error('Migration error (GET):', err);
      } finally {
        (global as any).migrateDataRouteRunning = false;
      }
    })();

    const resultUrl = `${req.protocol}://${req.headers.host}/api/v1/logs/migrate-data?dataScheduleId=${scheduledId}`;

    res.status(200).json({ success: true, dataScheduleId: scheduledId, msg: 'To Check Status or Result visit the Result Url.', resultUrl });
  } catch (error: any) {
    (global as any).migrateDataRouteRunning = false;
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export default {
  startMigration,
  getMigrationStatus,
};
