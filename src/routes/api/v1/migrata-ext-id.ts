import { Router } from 'express';
import {
  createMigrataExtIdForConsoleOrg,
  createMigrataExtId,
  deleteExtIdField,
  checkExtIdStatus,
  updateExtIdValues,
} from '../../../controllers/api/v1/migrataExtIdController';

const router = Router();

router.get('/console-org/create', createMigrataExtIdForConsoleOrg);
router.post('/create', createMigrataExtId);
router.get('/create', createMigrataExtId); // Old server used GET
router.post('/update', updateExtIdValues);
router.get('/update', updateExtIdValues); // Old server used GET
router.post('/delete', deleteExtIdField);
router.get('/delete', deleteExtIdField); // Old server used GET
router.get('/status', checkExtIdStatus);

router.post('/fetch-name', (req, res) => {
  res.json({ success: true, data: { extIdName: '' } });
});

export default router;
