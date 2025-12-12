import { Router } from 'express';
import {
  assignPermissionSet,
  fetchPermissionSetId,
} from '../../../controllers/api/v1/assignPermissionSetController';

const router = Router();

router.get('/', assignPermissionSet);
router.get('/fetch-id', fetchPermissionSetId);

export default router;
