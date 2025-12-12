import { Request, Response } from 'express';
import { registerClient } from '../../../utils/fieldDifferenceSSE';

export const fieldDifferenceSSEProgress = async (req: Request, res: Response) => {
  try {
    const dataScheduleId = String(req.query.dataScheduleId || '');
    if (!dataScheduleId) return res.status(400).json({ success: false, error: 'Missing dataScheduleId query param' });
    registerClient(dataScheduleId, res);
    // keep connection open; registerClient handles heartbeats and close
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
