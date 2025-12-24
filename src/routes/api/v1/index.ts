import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import { csrfProtection } from '../../../middlewares/antiCSRFValidator';
import migrateDataRoutes from './migrate-data';
import metadataRoutes from './metadata';
import fieldDifferenceRoutes from './field-difference';
import fieldDifferenceSSERoutes from './field-difference-sse';
import logsRoutes from './logs';
import permitObjectsRoutes from './permit-objects-and-fields';
import recordsCountRoutes from './records-count';
import syncRecordsRoutes from './sync-records';
import migrationExtIdRoutes from './migrata-ext-id';
import diffViewerRoutes from './diff-viewer';
import assignPermissionSetRoutes from './assign-permissionset';
import triggerOperationRoutes from './trigger-operation';
import objectFieldsRoutes from './object-fields';
import getExtraChildRecordsRoutes from './getExtraChildRecordsInTargetOrg';

const router = Router();

router.use('/auth', csrfProtection, authRoutes);
router.use('/migrate-data', migrateDataRoutes);
router.use('/logs', logsRoutes);
router.use('/migrata-ext-id', migrationExtIdRoutes);
router.use('/metadata', metadataRoutes);
router.use('/permit-objects-and-fields', permitObjectsRoutes);
router.use('/records-count', recordsCountRoutes);
router.use('/object-fields', objectFieldsRoutes);
router.use('/assign-permissionset', assignPermissionSetRoutes);
router.use('/field-difference', fieldDifferenceRoutes);
router.use('/field-difference-sse', fieldDifferenceSSERoutes);
router.use('/sync-records', syncRecordsRoutes);
router.use('/trigger-operation', triggerOperationRoutes);
router.use('/diff-viewer', diffViewerRoutes);
// router.use('/diffViewer', diffViewerRoutes);
router.use('/getExtraChildRecordsInTargetOrg', getExtraChildRecordsRoutes);

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

export default router;
