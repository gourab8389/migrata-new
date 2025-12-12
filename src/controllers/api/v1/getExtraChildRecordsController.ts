
import { Request, Response } from 'express';
import { getSfdcTokenConnection } from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import exportScheduledDataService from '../../../services/sfdc/exportScheduledData';
import { getDownloadFlowDetailed, getDataBatchItemFiltersObject, getDataFields } from '../../../services/sfdc/DataMetaDataService';
import { fetchExtIdName } from '../../../helpers/sfdc_extid_service/FetchExtIdNameService';
import { getSrcOrgRecords } from '../../../helpers/sfdc_import/SfdcRecordService';
import prisma from '../../../config/database';

const namespace = process.env.MIGRATA_NAMESPACE || '';

export const getExtraChildRecordsInTargetOrg = async (req: Request, res: Response) => {
  try {
    const dataScheduleId = req.query.dataScheduleId as string;
    if (!dataScheduleId) {
      return res.status(400).json({ success: false, error: 'dataScheduleId is required' });
    }

    // Get console org connection
    const consoleOrgConn = await getSfdcTokenConnection(process.env.CONSOLE_ORG_DOMAIN_NAME || '');
    if (!consoleOrgConn) {
      return res.status(500).json({ success: false, error: 'Failed to connect to console org' });
    }

    // Fetch schedule data (batchName, source/target org domains)
    const schedule = await exportScheduledDataService.fetchScheduleData(consoleOrgConn, dataScheduleId);
    const { batchName, sourceOrgDomainName, targetOrgDomainName } = schedule;

    // Get source and target org connections
    const sourceOrgConn = await getSfdcTokenConnection(sourceOrgDomainName);
    const targetOrgConn = await getSfdcTokenConnection(targetOrgDomainName);
    if (!sourceOrgConn || !targetOrgConn) {
      return res.status(500).json({ success: false, error: 'Failed to connect to source/target org' });
    }

    // Get object download flow and relationships
    const downloadFlow = await getDownloadFlowDetailed(consoleOrgConn, batchName, namespace);
    const objectNames = downloadFlow.resultArr;
    const objectNamesDetailed = downloadFlow.resultArrDetailed;
    const rootObjects = downloadFlow.rootObjects;

    // Get batch item filters
    const batchItemFilterObj = await getDataBatchItemFiltersObject(consoleOrgConn, batchName, namespace);

    // Prepare comparison
    const compareExternalIdList: Record<string, { source: any[]; target: any[] }> = {};
    const extraIdsFromTarget: Record<string, any[]> = {};
    for (const obj of objectNames) {
      if (obj === 'User') continue;
      compareExternalIdList[obj] = { source: [], target: [] };
    }

    // For each object, fetch records from source and target orgs
    for (const obj of objectNames.filter((o) => o !== 'User')) {
      const batchItemFilterObjRecord = batchItemFilterObj[obj] || {};
      const fieldNames = await getDataFields(consoleOrgConn, obj);
      const externalIdName = await fetchExtIdName(consoleOrgConn, obj, namespace);
      if (!externalIdName) continue;

      const [sourceOrgRecords, targetOrgRecords] = await Promise.all([
        getSrcOrgRecords(sourceOrgConn, obj, fieldNames),
        getSrcOrgRecords(targetOrgConn, obj, fieldNames),
      ]);

      compareExternalIdList[obj].source = sourceOrgRecords.map((r: any) => r[externalIdName]);
      compareExternalIdList[obj].target = targetOrgRecords.map((r: any) => r[externalIdName]);
    }

    // Compare and find extra IDs in target org
    for (const obj of objectNames.filter((o) => o !== 'User')) {
      const sourceIds = compareExternalIdList[obj]?.source || [];
      const targetIds = compareExternalIdList[obj]?.target || [];
      extraIdsFromTarget[obj] = [];
      if (sourceIds.length && targetIds.length) {
        if (sourceIds.length < targetIds.length) {
          const extraIds = targetIds.filter((id) => !sourceIds.includes(id));
          extraIdsFromTarget[obj].push(...extraIds);
        } else if (sourceIds.length > targetIds.length) {
          extraIdsFromTarget[obj].push('Source org has extra data');
        } else {
          const extraIds = targetIds.filter((id) => !sourceIds.includes(id));
          if (extraIds.length < 1) {
            extraIdsFromTarget[obj].push('Both orgs have the same data');
          } else {
            extraIdsFromTarget[obj].push(...extraIds);
          }
        }
      } else {
        extraIdsFromTarget[obj].push('NO Records Found');
      }
    }

    // Store result in DB (Prisma)
    await prisma.extraChildRecordsLog.upsert({
      where: { dataScheduleId },
      update: {
        recordsToDelete: extraIdsFromTarget,
        status: 'Complete',
      },
      create: {
        dataScheduleId,
        recordsToDelete: extraIdsFromTarget,
        status: 'Complete',
      },
    });

    res.status(200).json({
      success: true,
      dataScheduleId,
      batchName,
      recordsToDelete: extraIdsFromTarget,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
