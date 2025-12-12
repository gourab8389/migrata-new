import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { getSfdcTokenConnection } from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import exportScheduledData from '../../../services/sfdc/exportScheduledData';
import DataMetaDataService from '../../../services/sfdc/DataMetaDataService';

const namespace = process.env.MIGRATA_NAMESPACE || '';

const assignPermission = async (
  dataScheduleId: string,
  conn: any,
  targetOrgDomainName: string,
  objectNames: string[]
) => {
  try {
    // fetch Migrata_API Permission Set Id
    const q: any = await conn.query("SELECT id, name FROM PermissionSet WHERE name='Migrata_API' LIMIT 1");
    if (!q || !q.records || q.records.length === 0) {
      throw new Error('Migrata API Permission Set Not Found');
    }

    const Migrata_API_Id = q.records[0].Id;

    const objectPermissionDataArr: any[] = [];
    const result: any = {};

    for (const objectName of objectNames) {
      objectPermissionDataArr.push({
        SobjectType: objectName,
        PermissionsRead: true,
        PermissionsEdit: true,
        ParentId: Migrata_API_Id,
      });

      const fieldNames = await DataMetaDataService.getDataFields(conn, objectName);
      try {
        const fieldRes = await conn.sobject('FieldPermissions').insertBulk(
          fieldNames.map((f: string) => ({
            Field: `${objectName}.${f}`,
            SobjectType: objectName,
            PermissionsRead: true,
            PermissionsEdit: true,
            ParentId: Migrata_API_Id,
          }))
        );
        result[objectName] = { fieldPermissionResults: fieldRes };
      } catch (err: any) {
        result[objectName] = { fieldPermissionResults: { success: false, msg: err.message } };
      }
    }

    try {
      const objRes = await conn.sobject('ObjectPermissions').insertBulk(objectPermissionDataArr);
      let idx = 0;
      for (const objectName of objectNames) {
        result[objectName] = result[objectName] || {};
        result[objectName]['objectPermissionResult'] = objRes[idx++] || {};
      }
    } catch (err: any) {
      // attach error
      for (const objectName of objectNames) {
        result[objectName] = result[objectName] || {};
        result[objectName]['objectPermissionResult'] = { success: false, msg: err.message };
      }
    }

    // persist result into prisma log (merge under target domain)
    const existing = await prisma.permitObjectsAndFieldsLog.findUnique({ where: { dataScheduleId } });
    const newResult: any = (existing?.result as any) || {};
    newResult[targetOrgDomainName] = result;

    await prisma.permitObjectsAndFieldsLog.upsert({
      where: { dataScheduleId },
      update: { result: newResult },
      create: { dataScheduleId, result: newResult },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const existing = await prisma.permitObjectsAndFieldsLog.findUnique({ where: { dataScheduleId } });
    const newResult: any = (existing?.result as any) || {};
    newResult[targetOrgDomainName] = { error: msg };
    await prisma.permitObjectsAndFieldsLog.upsert({ where: { dataScheduleId }, update: { result: newResult }, create: { dataScheduleId, result: newResult } });
  }
};

export const permitObjectsAndFields = async (req: Request, res: Response) => {
  try {
    const dataScheduleId = String(req.query.dataScheduleId || '');
    if (!dataScheduleId) return res.status(400).json({ success: false, error: 'Data Schedule Id Not Found!' });

    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);
    if (!consoleOrgConn) return res.status(500).json({ success: false, error: 'Console org connection failed' });
    consoleOrgConn.bulk.pollTimeout = 120000;

    // fetch schedule and batchName
    const schedule = await exportScheduledData.fetchScheduleData(consoleOrgConn, dataScheduleId);
    const batchName = schedule.batchName || '';

    // fetch object names from batch items
    const dataObjects = await DataMetaDataService.getDataObjects(consoleOrgConn, batchName, namespace);
    const objectNames: string[] = dataObjects.map((o: any) => o.name).filter(Boolean);

    // fetch orgs
    const sourceDomain = schedule.sourceOrgDomainName;
    const targetDomain = schedule.targetOrgDomainName;

    const sourceOrgConn = await getSfdcTokenConnection(sourceDomain);
    if (sourceOrgConn) sourceOrgConn.bulk.pollTimeout = 120000;
    const targetOrgConn = await getSfdcTokenConnection(targetDomain);
    if (targetOrgConn) targetOrgConn.bulk.pollTimeout = 120000;

    // create log entry
    await prisma.permitObjectsAndFieldsLog.upsert({ where: { dataScheduleId }, update: { result: {} }, create: { dataScheduleId, result: {} } });

    // run assign operations in background
    if (sourceOrgConn) assignPermission(dataScheduleId, sourceOrgConn, sourceDomain, objectNames);
    if (targetOrgConn) assignPermission(dataScheduleId, targetOrgConn, targetDomain, objectNames);

    const resultUrl = `${req.protocol}://${req.headers.host}/api/v1/logs/permit-objects-and-fields?dataScheduleId=${dataScheduleId}`;

    return res.status(200).json({ success: true, id: dataScheduleId, msg: 'To Check Status or Result visit the Result Url.', resultUrl });
  } catch (error: any) {
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const checkPermitObjectsAndFieldsStatus = async (req: Request, res: Response) => {
  try {
    const dataScheduleId = String(req.query.dataScheduleId || '');
    if (!dataScheduleId) return res.status(400).json({ success: false, error: 'Data Schedule Id Not Found!' });

    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);
    if (!consoleOrgConn) return res.status(500).json({ success: false, error: 'Console org connection failed' });

    const schedule = await exportScheduledData.fetchScheduleData(consoleOrgConn, dataScheduleId);
    const batchName = schedule.batchName || '';

    const dataObjects = await DataMetaDataService.getDataObjects(consoleOrgConn, batchName, namespace);
    const objectNamesArr = [...new Set(dataObjects.map((o: any) => o.name).filter(Boolean))];
    if (objectNamesArr.length < 1) return res.status(400).json({ success: false, error: 'No Objects Found using this Data Schedule!' });

    const sourceDomain = schedule.sourceOrgDomainName;
    const targetDomain = schedule.targetOrgDomainName;

    const sourceOrgConn = await getSfdcTokenConnection(sourceDomain);
    if (sourceOrgConn) sourceOrgConn.bulk.pollTimeout = 120000;
    const targetOrgConn = await getSfdcTokenConnection(targetDomain);
    if (targetOrgConn) targetOrgConn.bulk.pollTimeout = 120000;

    const queryString = "SELECT id, ParentId, Parent.Name, SobjectType FROM ObjectPermissions WHERE Parent.Name='Migrata_API' AND SobjectType IN ('" + objectNamesArr.join("', '") + "')";

    const sourceOrgResult: any = sourceOrgConn ? await sourceOrgConn.query(queryString) : { records: [] };
    const targetOrgResult: any = targetOrgConn ? await targetOrgConn.query(queryString) : { records: [] };

    const objectPermissionStatus: any = {};
    objectPermissionStatus[sourceDomain] = 'Not Granted';
    if (sourceOrgResult.records.length === objectNamesArr.length) objectPermissionStatus[sourceDomain] = 'Granted';
    objectPermissionStatus[targetDomain] = 'Not Granted';
    if (targetOrgResult.records.length === objectNamesArr.length) objectPermissionStatus[targetDomain] = 'Granted';

    const log = await prisma.permitObjectsAndFieldsLog.findFirst({ where: { dataScheduleId }, orderBy: { createdAt: 'desc' } });

    return res.status(200).json({ success: true, msg: 'Check Permission Status for Migrata_API Permission Set', dataScheduleId, objectPermissionStatus, log: log?.result || {} });
  } catch (error: any) {
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

