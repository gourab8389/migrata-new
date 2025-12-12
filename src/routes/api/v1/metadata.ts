import { Router } from 'express';
import { checkDeployStatus, deployMetadata } from '../../../controllers/api/v1/metadataController';

const router = Router();

router.get('/deploy', checkDeployStatus);
router.post('/deploy', deployMetadata);

export default router;
