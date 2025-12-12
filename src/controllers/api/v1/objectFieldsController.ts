import { Request, Response } from 'express';
import getSfdcTokenConnection from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import { getDataObjects } from '../../../services/sfdc/DataMetaDataService';
import prisma from '../../../config/database';
import * as jsforce from 'jsforce';
const namespace = process.env.MIGRATA_NAMESPACE || '';

export const getObjectFields = async (req: Request, res: Response) => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Sechedule Id Found!' });
      return;
    }

    const scheduledId = String(req.query.dataScheduleId).replace(/'/g, "\\'");
    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);
    if (!consoleOrgConn) {
      res.status(500).json({ success: false, error: 'Failed to connect to console org' });
      return;
    }

    // fetch batch name from DataSchedule
    const query = `SELECT ${namespace}DataBatchId__r.Name, ${namespace}TargetOrg__r.${namespace}DomainName__c FROM ${namespace}DataSchedule__c WHERE Id='${scheduledId}'`;
    const schedule: any = await consoleOrgConn.query(query);
    const batchName = schedule.records[0]?.[namespace + 'DataBatchId__r']?.Name || '';
    const targetOrgDomainName = schedule.records[0]?.[namespace + 'TargetOrg__r']?.[namespace + 'DomainName__c'] || '';

    // Get object list
    const objects = await getDataObjects(consoleOrgConn as unknown as jsforce.Connection, batchName, namespace);
    const objectNames = objects.map((o) => o.name);

    // Attempt to call target org apex endpoint to fetch field metadata (legacy behavior)
    let targetFields: any = [];
    try {
      const targetConn = await getSfdcTokenConnection(targetOrgDomainName);
      if (targetConn) {
        const body = { objectNames: { ...objectNames } };
        // If apex endpoint exists, call it; otherwise fall back to empty
        try {
          // @ts-ignore
          targetFields = await targetConn.apex.post('/GetObjectFields/', body);
        } catch (apexErr: any) {
          console.warn('Apex GetObjectFields call failed, returning empty target fields', (apexErr as any)?.message || apexErr);
          targetFields = [];
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch target org fields:', (err as any)?.message || err);
    }

    return res.status(200).json({
      success: true,
      msg: 'List Of Objects With Their Field Names',
      targetOrgDomainName,
      targetOrgFieldNames: targetFields,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};
