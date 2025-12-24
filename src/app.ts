import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Routes
import routes from './routes';

const app: Express = express();

// ===== MIDDLEWARE =====

// Security
app.use(helmet());
app.use(
  cors({
    origin: [
      /.*\.lightning\.force\.com$/,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8080',
    ],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====
// Mount centralized routes (keeps parity with migrata-demo2)
app.use('/', routes as any);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;

