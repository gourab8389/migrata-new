import { Router, Request, Response } from 'express';
import { startMigration, getMigrationStatus, migrate } from '../../../controllers/api/v1/migrateDataController';

const router = Router();

router.post('/', startMigration);
router.get('/', migrate);
router.get('/status', getMigrationStatus);

export default router;
