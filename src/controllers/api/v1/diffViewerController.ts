import { Request, Response } from 'express';
import getSfdcTokenConnection from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import exportSvc from '../../../services/sfdc/exportScheduledData';
import prisma from '../../../config/database';

export const diffViewerForSourceTarget = async (req: Request, res: Response) => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'data schedule Id is not present' });
      return;
    }

    const scheduledId = String(req.query.dataScheduleId).replace(/'/g, "\\'");
    const consoleOrgConn = await getSfdcTokenConnection(process.env.CONSOLE_ORG_DOMAIN_NAME || '');
    if (!consoleOrgConn) {
      res.status(500).json({ success: false, error: 'Failed to connect to console org' });
      return;
    }

    const schedule = await (exportSvc as any).fetchScheduleData(consoleOrgConn, scheduledId);
    const batchName = schedule?.batchName || '';
    const sourceOrgDominName = schedule?.sourceOrgDomainName || '';
    const targetOrgDominName = schedule?.targetOrgDomainName || '';

    // Upsert CsvDataLog record in database to indicate fetching
    await prisma.csvDataLog.upsert({
      where: { dataScheduleId: scheduledId },
      update: {
        sourceOrg: sourceOrgDominName,
        targetOrg: targetOrgDominName,
        csvData: {},
        status: 'Fetching',
      },
      create: {
        dataScheduleId: scheduledId,
        sourceOrg: sourceOrgDominName,
        targetOrg: targetOrgDominName,
        csvData: {},
        status: 'Fetching',
      },
    });

    // In legacy server it triggered an async helper to build CSV files; here we return the result URL
    const resultUrl = `${req.protocol}://${req.headers.host}/api/v1/logs/diff-viewer?dataScheduleId=${req.query.dataScheduleId}`;

    res.status(200).json({
      success: true,
      consoleOrg: process.env.CONSOLE_ORG_DOMAIN_NAME,
      sourceOrg: sourceOrgDominName,
      targetOrg: targetOrgDominName,
      dataScheduleId: req.query.dataScheduleId,
      batchName,
      message: 'Successfully queued diff viewer generation',
      resultUrl,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error!!', error: error.message });
  }
};
