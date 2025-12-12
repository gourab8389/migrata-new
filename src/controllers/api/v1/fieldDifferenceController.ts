import { Request, Response } from 'express';
import { getSfdcTokenConnection } from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import exportScheduledData from '../../../services/sfdc/exportScheduledData';
import prisma from '../../../config/database';
import { getDataObjects } from '../../../services/sfdc/DataMetaDataService';
import { fetchExtIdName } from '../../../helpers/sfdc_extid_service/FetchExtIdNameService';
import FieldDifferenceHelper from '../../../helpers/sfdc_field_difference/FieldDifferenceHelper';

const namespace = process.env.MIGRATA_NAMESPACE || '';

const getOrgNameLocal = (orgName: string, orgsObj: any) => {
  const n = String(orgName || '').toLowerCase();
  if (n === 'console') return process.env.CONSOLE_ORG_DOMAIN_NAME || '';
  if (n === 'source') return orgsObj.sourceOrg;
  if (n === 'target') return orgsObj.targetOrg;
  return orgName;
};

export const getFieldDifference = async (req: Request, res: Response) => {
  try {
    const dataScheduleId = String(req.query.dataScheduleId || '');
    const compare = String(req.query.compare || '');
    const fieldScope = String(req.query.fieldScope || '');

    if (!dataScheduleId) return res.status(400).json({ success: false, error: 'Data Schedule Id Not Found!' });
    if (!compare) return res.status(400).json({ success: false, error: 'Param compare Not Found!' });
    if (!fieldScope) return res.status(400).json({ success: false, error: 'Param fieldScope Not Found!' });

    const consoleConn = await getSfdcTokenConnection(process.env.CONSOLE_ORG_DOMAIN_NAME || '');
    if (!consoleConn) return res.status(500).json({ success: false, error: 'Console org connection failed' });
    (consoleConn as any).bulk.pollTimeout = 120000;

    const schedule = await exportScheduledData.fetchScheduleData(consoleConn, dataScheduleId as string);
    const orgs: any = {
      sourceOrg: (schedule as any).sourceOrgDomainName || (schedule as any).sourceOrg || (schedule as any).sourceOrgId,
      targetOrg: (schedule as any).targetOrgDomainName || (schedule as any).targetOrg || (schedule as any).targetOrgId,
    };

    const compareArr = compare.split(',');
    if (compareArr.length < 2) return res.status(400).json({ success: false, error: 'Incorrect data in param compare!' });

    const comparisonSrc = getOrgNameLocal(compareArr[0], orgs);
    const comparisonTgt = getOrgNameLocal(compareArr[1], orgs);
    if (!comparisonSrc || !comparisonTgt) return res.status(400).json({ success: false, error: 'Error parsing the org domain name!' });

    const sourceConn = await getSfdcTokenConnection(comparisonSrc);
    const targetConn = await getSfdcTokenConnection(comparisonTgt);

    const objectNames: Record<string, string> = {};
    try {
      const dataObjects = await getDataObjects(consoleConn as any, (schedule as any).batchName, namespace);
      for (const obj of dataObjects) {
        const extId = await fetchExtIdName(consoleConn as any, obj.name, namespace);
        objectNames[obj.name] = extId || '';
      }
    } catch (e) {
      // ignore fallback
    }

    try {
      await prisma.fieldDifferenceLog.upsert({ where: { dataScheduleId }, update: { status: 'Fetching' }, create: { dataScheduleId, status: 'Fetching' } as any });
    } catch (e) {
      // ignore
    }

    try {
      // call local TypeScript helper
      FieldDifferenceHelper.getFieldDifferenceAsync(consoleConn as any, sourceConn as any, targetConn as any, dataScheduleId, objectNames, comparisonSrc, comparisonTgt, fieldScope).catch((err: any) => console.error('FieldDiff helper error', err));
    } catch (e) {
      console.error('Error invoking field diff helper', e);
    }

    const resultUrl = `${req.protocol}://${req.headers.host}/api/v1/logs/field-difference?dataScheduleId=${dataScheduleId}`;
    return res.status(200).json({ success: true, fieldScope, comparisonSrc, comparisonTgt, dataScheduleId, msg: 'Field Difference.', resultUrl });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, msg: 'Error Occured!', error: error.message });
  }
};

export const deployFieldDifference = async (req: Request, res: Response) => {
  try {
    const { dataScheduleId, sourceOrg, targetOrg, data, checkOnly } = req.body;
    if (!dataScheduleId || !sourceOrg || !targetOrg || !data) return res.status(400).json({ success: false, msg: 'Bad Request!' });
    if (!Array.isArray(data)) return res.status(400).json({ success: false, msg: 'Data must be an array.' });

    const srcConn = await getSfdcTokenConnection(sourceOrg);
    const targetConn = await getSfdcTokenConnection(targetOrg);

    const pkg = { types: [...data] };
    const zipRetrieve = await (srcConn as any).metadata.retrieve({ unpackaged: [pkg], singlePackage: false, apiVersion: '49.0' });

    try {
      await prisma.deployFromFieldDiffLog.create({ data: { dataScheduleId, targetOrg, deployId: `deploy_${Date.now()}`, retrieveId: zipRetrieve.id, status: 'Retrieving' } as any });
    } catch (e) {
      // ignore
    }

    const poll = setInterval(async () => {
      try {
        const pollResult = await (srcConn as any).metadata.checkRetrieveStatus(zipRetrieve.id);
        if (pollResult.status === 'Succeeded') {
          clearInterval(poll);
          try {
            // try legacy deploy helper
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const legacyDeploy = require('d:/migrata/migrata-demo2/helpers/sfdc_field_difference/FieldDeploymentHelper');
            const deploymentResult = await legacyDeploy.deployfields('', null, targetOrg, targetConn, pollResult.zipFile, checkOnly);
            if (deploymentResult && deploymentResult.success) {
              try {
                // trigger fresh diff calc using legacy helper
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const legacyDiff = require('d:/migrata/migrata-demo2/helpers/sfdc_field_difference/FieldDifferenceHelper');
                const consoleConn = await getSfdcTokenConnection(process.env.CONSOLE_ORG_DOMAIN_NAME || '');
                let objNames: Record<string, string> = {};
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const legacyQuery = require('d:/migrata/migrata-demo2/helpers/sfdc_extid_service/DataObjectQueryService');
                  const qres = await legacyQuery.queryDataObject(consoleConn, dataScheduleId);
                  for (const r of qres.records) objNames[r.Name] = r[`${namespace}DataIdField__c`];
                } catch (qe) {
                  // ignore
                }
                legacyDiff.getFieldDifferenceAsync(consoleConn, await getSfdcTokenConnection(sourceOrg), await getSfdcTokenConnection(targetOrg), dataScheduleId, null, objNames, sourceOrg, targetOrg, 'all');
              } catch (err) {
                console.error('Error triggering refresh diff:', err);
              }
            }
          } catch (deployError) {
            console.error('Error during deployment:', deployError);
          }
        }
      } catch (pollErr) {
        console.error('Poll error', pollErr);
      }
    }, 7000);

    const resultUrl = `${req.protocol}://${req.headers.host}/api/v1/logs/field-difference/deploy?dataScheduleId=${dataScheduleId}`;
    return res.status(200).json({ success: true, msg: 'Success', retrieveId: zipRetrieve.id, resultUrl });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, msg: 'Error Occured!', error: error.message });
  }
};

export const deleteFieldDifference = async (req: Request, res: Response) => {
  try {
    const { targetOrg, data } = req.body;
    if (!targetOrg || !data || !Array.isArray(data)) return res.status(400).json({ success: false, msg: 'Bad Request!' });
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const legacyDelete = require('d:/migrata/migrata-demo2/helpers/sfdc_field_difference/FieldDeleteHelper');
      const targetConn = await getSfdcTokenConnection(targetOrg);
      const result = await legacyDelete.deleteFields(targetConn, data);
      return res.status(200).json({ success: true, msg: 'Fields delete operation result.', result });
    } catch (e) {
      return res.status(500).json({ success: false, msg: 'Error Occured!', error: String(e) });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, msg: 'Error Occured!', error: error.message });
  }
};

export default {
  getFieldDifference,
  deployFieldDifference,
  deleteFieldDifference,
};
