import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Controllers
import * as authController from './controllers/api/v1/authController';
import * as logsController from './controllers/api/v1/logsController';
import * as migrateDataController from './controllers/api/v1/migrateDataController';
import * as metadataController from './controllers/api/v1/metadataController';
import * as migrataExtIdController from './controllers/api/v1/migrataExtIdController';

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


// Old server root-level endpoints
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end();
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Migrata 2.0!',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/v1/auth/authenticate',
      migrate: 'POST /api/v1/migrate-data/start',
      logs: 'GET /api/v1/logs/*',
    },
  });
});

app.get('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Auth routes
app.post('/api/v1/auth/authenticate', authController.authenticate);
app.get('/api/v1/auth/callback', authController.callback);
app.get('/api/v1/auth/check-status', authController.checkStatus);
app.post('/api/v1/auth/revoke', authController.revokeAuth);

// Migration routes
app.post('/api/v1/migrate-data/start', migrateDataController.startMigration);
app.get('/api/v1/migrate-data/status', migrateDataController.getMigrationStatus);

// Metadata routes
app.post('/api/v1/metadata/deploy', metadataController.deployMetadata);
app.get('/api/v1/metadata/status', metadataController.getMetadataDeployStatus);

// External ID routes
app.post('/api/v1/migrata-ext-id/console-org', migrataExtIdController.createMigrataExtIdForConsoleOrg);
app.post('/api/v1/migrata-ext-id/create', migrataExtIdController.createMigrataExtId);
app.post('/api/v1/migrata-ext-id/delete', migrataExtIdController.deleteExtIdField);
app.get('/api/v1/migrata-ext-id/check-status', migrataExtIdController.checkExtIdStatus);
app.post('/api/v1/migrata-ext-id/update-values', migrataExtIdController.updateExtIdValues);

// Log retrieval routes
app.get('/api/v1/logs/migrate-data-logs', logsController.getMigrateDataLogs);
app.get('/api/v1/logs/create-custom-field-logs', logsController.getCreateCustomFieldLogs);
app.get('/api/v1/logs/delete-custom-field-logs', logsController.getDeleteCustomFieldLogs);
app.get('/api/v1/logs/update-extid-value-logs', logsController.getUpdateExtIdValueLogs);
app.get('/api/v1/logs/permit-objects-logs', logsController.getPermitObjectsAndFieldsLogs);
app.get('/api/v1/logs/record-count-logs', logsController.getRecordCountLogs);
app.get('/api/v1/logs/field-difference-logs', logsController.getFieldDifferenceLogs);
app.get('/api/v1/logs/field-diff-deploy-logs', logsController.getDeployFieldDifferenceLogs);
app.get('/api/v1/logs/duplicate-records-logs', logsController.getDuplicateRecordsLogs);
app.get('/api/v1/logs/diff-viewer-logs', logsController.getDiffViewerLogs);
app.get('/api/v1/logs/error-logs', logsController.getErrorLogs);
app.post('/api/v1/logs/error-logs', logsController.postErrorLogs);

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

