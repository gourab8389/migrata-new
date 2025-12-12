import { Request, Response } from 'express';
import prisma from '../../../config/database';


 // Get record counts from source and target orgs

export const getRecordCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { dataScheduleId } = req.query;
    if (!dataScheduleId) {
      res.status(400).json({ success: false, error: 'No Data Schedule Id Found!' });
      return;
    }

    const log = await prisma.recordCountLog.upsert({
      where: { dataScheduleId: String(dataScheduleId) },
      update: { status: 'IN_PROGRESS' },
      create: {
        dataScheduleId: String(dataScheduleId),
        status: 'IN_PROGRESS',
        recordCounts: {},
      },
    });

    res.status(202).json({
      success: true,
      message: 'Record count operation started',
      dataScheduleId,
      resultUrl: `/api/v1/logs/record-count-logs?dataScheduleId=${dataScheduleId}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error!',
      error: error.message,
    });
  }
};

export default {
  getRecordCount,
};
