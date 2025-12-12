import { Request, Response } from 'express';
import getSfdcTokenConnection from '../../../helpers/sfdc_common/SfdcTokenConnectionService';
import prisma from '../../../config/database';

/**
 * Create migrata external ID field for console org
 */
export const createMigrataExtIdForConsoleOrg = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const log = await prisma.createCustomFieldLog.create({
      data: {
        dataScheduleId: 'console-org-extid',
        consoleOrgDomainName: process.env.CONSOLE_ORG_DOMAIN_NAME || '',
        consoleOrgOnly: true,
        status: 'IN_PROGRESS',
      },
    });
    res.status(202).json({
      success: true,
      message: 'External ID field creation started',
      resultUrl: '/api/v1/logs/create-custom-field-logs?dataScheduleId=console-org-extid',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};

/**
 * Create migrata external ID field
 */
export const createMigrataExtId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { dataScheduleId } = req.query;
    if (!dataScheduleId) {
      res.status(400).json({ success: false, error: 'No dataScheduleId' });
      return;
    }
    const log = await prisma.createCustomFieldLog.upsert({
      where: { dataScheduleId: String(dataScheduleId) },
      update: { status: 'IN_PROGRESS' },
      create: { dataScheduleId: String(dataScheduleId), status: 'IN_PROGRESS' },
    });
    res.status(202).json({
      success: true,
      message: 'External ID field creation started',
      resultUrl: `/api/v1/logs/create-custom-field-logs?dataScheduleId=${dataScheduleId}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};

/**
 * Delete external ID field
 */
export const deleteExtIdField = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { dataScheduleId } = req.query;
    if (!dataScheduleId) {
      res.status(400).json({ success: false, error: 'No dataScheduleId' });
      return;
    }
    const log = await prisma.deleteCustomFieldLog.upsert({
      where: { dataScheduleId: String(dataScheduleId) },
      update: { status: 'IN_PROGRESS' },
      create: { dataScheduleId: String(dataScheduleId), status: 'IN_PROGRESS' },
    });
    res.status(202).json({
      success: true,
      message: 'External ID field deletion started',
      resultUrl: `/api/v1/logs/delete-custom-field-logs?dataScheduleId=${dataScheduleId}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};

/**
 * Check external ID status
 */
export const checkExtIdStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { dataScheduleId } = req.query;
    if (!dataScheduleId) {
      res.status(400).json({ success: false, error: 'No dataScheduleId' });
      return;
    }
    const log = await prisma.createCustomFieldLog.findFirst({
      where: { dataScheduleId: String(dataScheduleId) },
    });
    if (!log) {
      res.status(404).json({ success: false, error: 'Log not found' });
      return;
    }
    res.status(200).json({
      success: true,
      status: log.status,
      result: log.result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};

/**
 * Update external ID values
 */
export const updateExtIdValues = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { dataScheduleId } = req.query;
    if (!dataScheduleId) {
      res.status(400).json({ success: false, error: 'No dataScheduleId' });
      return;
    }
    const log = await prisma.updateExtIdValueLog.upsert({
      where: { dataScheduleId: String(dataScheduleId) },
      update: { status: 'IN_PROGRESS' },
      create: { dataScheduleId: String(dataScheduleId), status: 'IN_PROGRESS' },
    });
    res.status(202).json({
      success: true,
      message: 'External ID value update started',
      resultUrl: `/api/v1/logs/update-extid-value-logs?dataScheduleId=${dataScheduleId}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error!', error: error.message });
  }
};

export default {
  createMigrataExtIdForConsoleOrg,
  createMigrataExtId,
  deleteExtIdField,
  checkExtIdStatus,
  updateExtIdValues,
};
