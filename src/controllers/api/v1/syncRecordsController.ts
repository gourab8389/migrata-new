import { Request, Response } from 'express';
import { getSfdcTokenConnection } from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import DataMetaDataService from '../../../services/sfdc/DataMetaDataService';
import exportScheduledData from '../../../services/sfdc/exportScheduledData';
import { getSrcOrgRecords } from '../../../helpers/sfdc_import/SfdcRecordService';

const md5 = require('md5');
const namespace = process.env.MIGRATA_NAMESPACE || '';

const reverseMap = async (oriMap: Record<string, any>) => {
  const reverse: Record<string, string> = {};
  for (const key in oriMap) {
    if (typeof oriMap[key] === 'string') reverse[oriMap[key]] = key;
  }
  return reverse;
};

export const syncRecords = async (req: Request, res: Response) => {
  try {
    const objectNamesParam = String(req.query.objectNames || '');
    const objectNames = objectNamesParam ? objectNamesParam.split(',') : [];
    const sourceOrgName = String(req.query.sorg || '');
    const targetOrgName = String(req.query.torg || '');

    if (objectNames.length === 0 || !sourceOrgName || !targetOrgName) {
      return res.status(400).json({ success: false, error: 'Query params are not passed properly' });
    }

    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);
    if (!consoleOrgConn) return res.status(500).json({ success: false, error: 'Console org connection failed' });

    // Try to use legacy diff helper if available (workspace path)
    let getDiffContent: any = null;
    try {
      // absolute path to legacy helper
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const legacy = require('d:/migrata/migrata-demo2/helpers/sfdc_diff_content/DuplicateRecordsHelper');
      getDiffContent = legacy.getDiffContent;
    } catch (err) {
      getDiffContent = null;
    }

    // If legacy diff helper exists, use it to compute maps; otherwise compute minimal mapping
    let diffContentData: any = null;
    if (getDiffContent) {
      diffContentData = await getDiffContent(consoleOrgConn, 'Complete', objectNames, sourceOrgName, targetOrgName);
    } else {
      // minimal mapping: fetch records and build simple maps using external id
      diffContentData = { responseResult: { SourceOrg: { ExternalId: {}, UniqueFields: {} }, TargetOrg: { ExternalId: {}, UniqueFields: {} } }, mapRecordsId: { SourceOrg: {}, TargetOrg: {} }, recordsAll: { TargetOrg: {} } };
      for (const obj of objectNames) {
        // fallback: use a default external id placeholder
        const eName = 'ExternalId__c';
        diffContentData.responseResult.SourceOrg.ExternalId[obj] = eName;
        diffContentData.responseResult.TargetOrg.ExternalId[obj] = eName;

        // fetch target records
        const targetConn = await getSfdcTokenConnection(targetOrgName);
        const targetFields = ['Id', eName];
        const targetRecords = targetConn ? await getSrcOrgRecords(targetConn as any, obj, targetFields) : [];
        diffContentData.recordsAll.TargetOrg[obj] = targetRecords;
        diffContentData.mapRecordsId.SourceOrg[obj] = { HashKey: {}, ExtId: {} };
        diffContentData.mapRecordsId.SourceOrg[obj].ExtId = {};
      }
    }

    // perform updates on target org based on mapping (legacy behaviour expects hash-based mapping)
    const targetOrgConn = await getSfdcTokenConnection(targetOrgName);
    const targetOrgRecords = diffContentData.recordsAll.TargetOrg;
    const updateResultObj: Record<string, any> = {};

    for (let i = 0; i < objectNames.length; i++) {
      const objName = objectNames[i];
      const objRecords = targetOrgRecords[objName] || [];
      const extIdName = diffContentData.responseResult.TargetOrg.ExternalId[objName];

      // build reverse map of source ext id mapping if available
      const extIdSrcOrgMap = diffContentData.mapRecordsId?.SourceOrg?.[objName]?.ExtId || {};
      const srcOrgIdExtIdMap = await reverseMap(extIdSrcOrgMap);

      const updateArray: any[] = [];
      for (const rec of objRecords) {
        const srcOrgId = diffContentData.mapRecordsId?.SourceOrg?.[objName]?.HashKey?.[rec['HashKey']];
        const srcOrgExtId = srcOrgIdExtIdMap[srcOrgId];
        if (srcOrgId && srcOrgExtId && srcOrgExtId !== rec[extIdName]) {
          const updateRecordObj: any = { Id: rec['Id'] };
          updateRecordObj[extIdName] = srcOrgExtId;
          updateArray.push(updateRecordObj);
        }
      }

      let updateResult = null;
      if (updateArray.length > 0 && targetOrgConn) {
        // use bulk update if available
        updateResult = await (targetOrgConn as any).sobject(objName).updateBulk(updateArray);
      }

      updateResultObj[objName] = updateResult;
    }

    return res.status(200).json({ success: true, msg: 'Records Sync Successfully', result: updateResultObj });
  } catch (error: any) {
    console.error('Error on syncRecords:::', error);
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const duplicateRecords = async (req: Request, res: Response) => {
  try {
    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);

    let scope = String(req.query.scope || '');
    const objectNamesParam = String(req.query.objectNames || '');
    const objectNames = objectNamesParam ? objectNamesParam.split(',') : [];
    const sourceOrgName = String(req.query.sorg || '');
    const targetOrgName = String(req.query.torg || '');

    if (objectNames.length === 0 || !sourceOrgName || !targetOrgName) {
      return res.status(400).json({ success: false, error: 'Query params are not passed properly' });
    }
    if (!scope) return res.status(400).json({ success: false, error: 'Scope is not defined' });

    const low = scope.toLowerCase();
    if (!(low === 'sourceorg' || low === 'targetorg' || low === 'complete')) return res.status(400).json({ success: false, error: 'Scope is not passed properly' });
    if (low === 'sourceorg') scope = 'SourceOrg'; else if (low === 'targetorg') scope = 'TargetOrg'; else scope = 'Complete';

    // Try to use legacy helper for duplicate handling
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const legacy = require('d:/migrata/migrata-demo2/helpers/sfdc_diff_content/DuplicateRecordsHelper');
      legacy.helperDuplicateRecords(consoleOrgConn, scope, objectNames, sourceOrgName, targetOrgName, null);
    } catch (err) {
      // no-op if legacy helper not available
    }

    const resultUrl = `${req.protocol}://${req.headers.host}/api/v1/logs/dulplicate-records?objectNames=${objectNames}&sorg=${sourceOrgName}&torg=${targetOrgName}&scope=${scope}`;

    return res.status(200).json({ success: true, consoleOrg: consoleOrgDomain, msg: 'To check status, visit the result URL.', resultUrl });
  } catch (error: any) {
    console.error('Error in diff content', error);
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};
