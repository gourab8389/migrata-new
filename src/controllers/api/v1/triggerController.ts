import { Request, Response } from 'express';
import { getSfdcTokenConnection } from '../../../../src/helpers/sfdc_common/SfdcTokenConnectionService';
import exportScheduledData from '../../../services/sfdc/exportScheduledData';

export const triggerOperation = async (req: Request, res: Response) => {
  try {
    const dataScheduleId = String(req.query.dataScheduleId || '');
    if (!dataScheduleId) {
      return res.status(400).json({ success: false, error: 'Data Schedule Id Not Found!' });
    }

    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const consoleOrgConn = await getSfdcTokenConnection(consoleOrgDomain);
    if (!consoleOrgConn) return res.status(500).json({ success: false, error: 'Console org connection failed' });

    const schedule = await exportScheduledData.fetchScheduleData(consoleOrgConn, dataScheduleId as string);
    const targetDomain = schedule.targetOrgDomainName;
    if (!targetDomain) return res.status(400).json({ success: false, error: 'Target org not found for schedule' });

    const targetConn = await getSfdcTokenConnection(targetDomain);
    if (!targetConn) return res.status(500).json({ success: false, error: 'Target org connection failed' });

    const enableValue = req.query.isEnabled;
    const apiUrl = '/TargetOrgMaintenanceApi/';

    const data = await targetConn.apex.put(apiUrl, { isEnabled: enableValue });
    const parseData = typeof data === 'string' ? JSON.parse(data) : data;

    return res.status(200).json({ success: true, data: parseData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
