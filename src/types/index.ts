export interface IRegisteredOrg {
  id: string;
  domainName: string;
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDataMigration {
  id: string;
  dataScheduleId: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Scheduled';
  sourceOrgId: string;
  targetOrgId: string;
  dataBatchId?: string;
  scheduledStartTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMigrationLog {
  id: string;
  dataMigrationId: string;
  objectName: string;
  recordCount: number;
  successCount: number;
  failureCount: number;
  errorMessage?: string;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IObjectMapping {
  id: string;
  dataMigrationId: string;
  sourceObject: string;
  targetObject: string;
  fieldMappings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFieldMapping {
  id: string;
  registeredOrgId: string;
  objectName: string;
  sourceField: string;
  targetField: string;
  fieldType: string;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userId?: string;
  createdAt: Date;
}

export interface IPermissionSet {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfile {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISfdcConnection {
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface ISfdcQueryResult {
  totalSize: number;
  done: boolean;
  records: ISfdcRecord[];
}

export interface ISfdcRecord {
  Id: string;
  attributes: {
    type: string;
    url: string;
  };
  [key: string]: any;
}

export interface IMigrationRequest {
  dataScheduleId: string;
  dataBatchIds?: string[];
  test?: boolean;
}

export interface IMigrationResponse {
  success: boolean;
  message: string;
  dataMigrationId?: string;
  data?: Record<string, any>;
}

export interface IErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

export interface IDataBatch {
  id: string;
  name: string;
  description?: string;
  objectNames: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeploymentResult {
  success: boolean;
  deployId: string;
  status: string;
  details: Record<string, any>;
}

export interface IExportResult {
  objectName: string;
  recordCount: number;
  successCount: number;
  failureCount: number;
  errors: Record<string, string>[];
}

export interface IImportResult {
  objectName: string;
  recordsImported: number;
  recordsFailed: number;
  errors: Record<string, string>[];
}

export interface IPaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface IMetadata {
  objectName: string;
  fields: IField[];
  relationships: IRelationship[];
}

export interface IField {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  required: boolean;
  unique: boolean;
  updateable: boolean;
  referenceTo?: string[];
}

export interface IRelationship {
  name: string;
  relationshipName: string;
  type: string;
  referenceTo: string;
}

export interface ISessionData {
  csrf: string;
  user?: {
    id: string;
    email: string;
    domain: string;
  };
}

export interface IAsyncTask {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  result?: Record<string, any>;
  error?: string;
}

export interface IScheduledJob {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICSVRecord {
  [key: string]: string;
}

export interface IFieldDifference {
  objectName: string;
  sourceFields: Record<string, IField>;
  targetFields: Record<string, IField>;
  addedFields: string[];
  removedFields: string[];
  modifiedFields: string[];
}

export interface IPermissionDifference {
  permissionSetName: string;
  sourcePermissions: Record<string, boolean>;
  targetPermissions: Record<string, boolean>;
  grantedPermissions: string[];
  revokedPermissions: string[];
}

export type ApiStatus = 'success' | 'error' | 'pending' | 'processing';
