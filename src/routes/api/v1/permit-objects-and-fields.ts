import { Router } from 'express';
import {
  permitObjectsAndFields,
  checkPermitObjectsAndFieldsStatus,
} from '../../../controllers/api/v1/permitObjectsAndFieldsController';

const router = Router();

router.get('/', permitObjectsAndFields);
router.get('/status', checkPermitObjectsAndFieldsStatus);

export default router;
