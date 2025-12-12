import { Request, Response } from 'express';
import prisma from '../../../config/database';

export const getCreateCustomFieldForConsoleOrgLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const consoleOrgDomain = process.env.CONSOLE_ORG_DOMAIN_NAME || '';
    const log = await prisma.createCustomFieldLog.findFirst({
      where: { consoleOrgDomainName: consoleOrgDomain, consoleOrgOnly: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      res.status(404).json({ success: false, error: `Migrata Ext Id not created for domain: ${consoleOrgDomain}` });
      return;
    }

    res.status(200).json({ success: true, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getCreateCustomFieldLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.createCustomFieldLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      res.status(404).json({ success: false, error: `No logs found for ${req.query.dataScheduleId}` });
      return;
    }

    res.status(200).json({ success: true, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getUpdateExtIdValueLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.updateExtIdValueLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getDeleteCustomFieldLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.deleteCustomFieldLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getMigrateDataLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.migrateDataLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getPermitObjectsAndFieldsLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.permitObjectsAndFieldsLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getFieldDifferenceLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.fieldDifferenceLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getDeployFieldDifferenceLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.deployFromFieldDiffLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getRecordCountLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.recordCountLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getDuplicateRecordsLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.duplicateRecordsLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getDiffViewerLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.diffViewerLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    res.status(log ? 200 : 404).json({ success: !!log, ...log });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const postErrorLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataScheduleId, errorMessage, errorStack, endpoint } = req.body;
    const errorLog = await prisma.errorLog.create({
      data: { dataScheduleId, errorMessage, errorStack, endpoint },
    });

    res.status(201).json({ success: true, message: 'Error logged successfully', id: errorLog.id });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getErrorLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 100;
    const logs = await prisma.errorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};

export const getMigrateDataStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.query.dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.migrateDataLog.findFirst({
      where: { dataScheduleId: String(req.query.dataScheduleId) },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      res.status(404).json({ success: false, error: `Migration not found` });
      return;
    }

    res.status(200).json({
      success: true,
      status: log.status,
      dataScheduleId: log.dataScheduleId,
      objectNames: log.objectNames,
      insertResult: log.insertResult,
      updateResult: log.updateResult,
      sourceOrg: log.sourceOrg,
      targetOrg: log.targetOrg,
      batchName: log.batchName,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: 'Error!', error: error.message });
  }
};
