import { Router, Request, Response } from 'express';
import apiRoutes from './api';

const router = Router();

// handle favicon
router.get('/favicon.ico', (req: Request, res: Response) => {
  return res.status(204).end();
});

// home route
router.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    msg: 'Welcome to Migrata!',
  });
});

// mount API routes under /api (keeps parity with old server)
router.use('/api', apiRoutes as any);

// catch-all for undefined routes at root level
router.get('*', (req: Request, res: Response) => {
  return res.status(200).json({
    msg: 'This Route is not available!',
  });
});

export default router;
