import { Router } from 'express';
import {
  getMigrateDataLogs,
  getFieldDifferenceLogs,
  getDeployFieldDifferenceLogs,
  getRecordCountLogs,
  getCreateCustomFieldLogs,
  getUpdateExtIdValueLogs,
  getDeleteCustomFieldLogs,
  getCreateCustomFieldForConsoleOrgLogs,
  getPermitObjectsAndFieldsLogs,
  getDiffViewerLogs,
  getDuplicateRecordsLogs,
  postErrorLogs,
  getErrorLogs,
  getMigrateDataStatus,
} from '../../../controllers/api/v1/logsController';

const router = Router();

router.get('/migrate-data', getMigrateDataLogs);
router.get('/field-difference', getFieldDifferenceLogs);
router.get('/field-difference/deploy', getDeployFieldDifferenceLogs);
router.get('/records-count', getRecordCountLogs);
router.get('/migrata-ext-id/create', getCreateCustomFieldLogs);
router.get('/migrata-ext-id/update', getUpdateExtIdValueLogs);
router.get('/migrata-ext-id/delete', getDeleteCustomFieldLogs);
router.get('/migrata-ext-id/console-org/create', getCreateCustomFieldForConsoleOrgLogs);
router.get('/permit-objects-and-fields', getPermitObjectsAndFieldsLogs);
router.get('/diff-viewer', getDiffViewerLogs);
router.get('/diffViewer', getDiffViewerLogs); // Alias for old casing
router.get('/duplicate-records', getDuplicateRecordsLogs);
router.get('/dulplicate-records', getDuplicateRecordsLogs); // Alias for old typo
router.post('/error-logs', postErrorLogs);
router.get('/error', getErrorLogs);
router.get('/migrate-data-status', getMigrateDataStatus);

export default router;
