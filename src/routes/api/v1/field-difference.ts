import { Router } from 'express';
import {
  getFieldDifference,
  deployFieldDifference,
  deleteFieldDifference,
} from '../../../controllers/api/v1/fieldDifferenceController';

const router = Router();

router.get('/', getFieldDifference);
router.post('/deploy', deployFieldDifference);
router.post('/delete', deleteFieldDifference);

export default router;
