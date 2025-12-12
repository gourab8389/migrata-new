import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { getSfdcTokenConnection } from '../../../helpers/sfdc_common/SfdcTokenConnectionService';

export const assignPermissionSet = async (req: Request, res: Response) => {
  try {
    const targetOrg = String(req.query.targetOrg || '');
    if (!targetOrg) return res.status(400).json({ success: false, error: 'No Target Org Domain Name Found!' });

    // fetch userId from registered orgs table
    const regOrg = await prisma.registeredOrg.findUnique({ where: { domainName: targetOrg.toLowerCase() } });
    const userId = regOrg?.userId || '';

    const conn = await getSfdcTokenConnection(targetOrg);
    if (!conn) return res.status(500).json({ success: false, error: 'Connection failed' });

    // fetch Migrata_API permission set id
    const queryResult: any = await conn.query("SELECT id, name FROM PermissionSet WHERE name='Migrata_API' LIMIT 1");
    if (!queryResult || !queryResult.records || queryResult.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Migrata_API Permission Set Not Found!' });
    }

    const permissionSetId = queryResult.records[0].Id;

    // assign (use bulk insert to match legacy behavior)
    const result = await conn.sobject('PermissionSetAssignment').insertBulk([
      { PermissionSetId: permissionSetId, AssigneeId: userId },
    ]);

    return res.status(200).json({ success: true, userId, permissionSetId, result: result[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const fetchPermissionSetId = async (req: Request, res: Response) => {
  try {
    const targetOrg = String(req.query.targetOrg || '');
    if (!targetOrg) return res.status(400).json({ success: false, error: 'No Target Org Domain Name Found!' });

    const conn = await getSfdcTokenConnection(targetOrg);
    if (!conn) return res.status(500).json({ success: false, error: 'Connection failed' });

    const queryResult: any = await conn.query("SELECT id, name FROM PermissionSet WHERE name='Migrata_API' LIMIT 1");
    if (!queryResult || !queryResult.records || queryResult.records.length === 0) {
      return res.status(404).json({ success: false, permissionSetId: null });
    }

    return res.status(200).json({ success: true, permissionSetId: queryResult.records[0].Id });
  } catch (error: any) {
    return res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};
