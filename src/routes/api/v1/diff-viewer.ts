import { Router } from 'express';
import { diffViewerForSourceTarget } from '../../../controllers/api/v1/diffViewerController';

const router = Router();

router.get('/', diffViewerForSourceTarget);
router.get('/diffViewer', diffViewerForSourceTarget); // Alias for old casing

export default router;
