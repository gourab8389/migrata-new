# Database Schema and Models

## Overview

Migrata uses PostgreSQL with Prisma ORM for data management. This document describes all database models and their relationships.

## Database Models

### 1. RegisteredOrg

Stores Salesforce organization credentials and connection information.

```typescript
model RegisteredOrg {
  id              String   @id @default(cuid())
  domainName      String   @unique
  instanceUrl     String
  accessToken     String
  refreshToken    String?
  clientId        String?
  clientSecret    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  dataMigrations    DataMigration[]
  fieldMappings     FieldMapping[]
  targetMigrations  DataMigration[] @relation("targetOrg")
}
```

**Use**: Store credentials for source and target Salesforce organizations

**Example**:
```json
{
  "id": "cuid123",
  "domainName": "prod.salesforce.com",
  "instanceUrl": "https://instance.salesforce.com",
  "accessToken": "encrypted_token",
  "refreshToken": "refresh_token",
  "clientId": "client_id",
  "clientSecret": "secret"
}
```

---

### 2. DataMigration

Tracks individual migration jobs and their status.

```typescript
model DataMigration {
  id                String   @id @default(cuid())
  dataScheduleId    String   @unique
  status            String   @default("Pending")
  sourceOrgId       String
  targetOrgId       String
  dataBatchId       String?
  scheduledStartTime DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  sourceOrg         RegisteredOrg @relation(fields: [sourceOrgId], references: [id])
  targetOrg         RegisteredOrg @relation("targetOrg", fields: [targetOrgId], references: [id])
  migrationLogs     MigrationLog[]
  objectMappings    ObjectMapping[]
}
```

**Statuses**: Pending, InProgress, Completed, Failed, Scheduled

**Use**: Main table to track migrations

**Example**:
```json
{
  "id": "mig123",
  "dataScheduleId": "a15xx000000001",
  "status": "InProgress",
  "sourceOrgId": "source_org_id",
  "targetOrgId": "target_org_id",
  "dataBatchId": "batch123",
  "scheduledStartTime": "2024-12-11T10:00:00Z"
}
```

---

### 3. MigrationLog

Detailed logs for each object migrated in a migration.

```typescript
model MigrationLog {
  id              String   @id @default(cuid())
  dataMigrationId String
  objectName      String
  recordCount     Int      @default(0)
  successCount    Int      @default(0)
  failureCount    Int      @default(0)
  errorMessage    String?
  details         Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  dataMigration   DataMigration @relation(fields: [dataMigrationId], references: [id], onDelete: Cascade)
}
```

**Use**: Track migration results per object

**Example**:
```json
{
  "id": "log123",
  "dataMigrationId": "mig123",
  "objectName": "Account",
  "recordCount": 1000,
  "successCount": 950,
  "failureCount": 50,
  "errorMessage": "Some records failed",
  "details": {
    "failedIds": ["id1", "id2"]
  }
}
```

---

### 4. ObjectMapping

Maps objects between source and target organizations.

```typescript
model ObjectMapping {
  id              String   @id @default(cuid())
  dataMigrationId String
  sourceObject    String
  targetObject    String
  fieldMappings   Json
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  dataMigration   DataMigration @relation(fields: [dataMigrationId], references: [id], onDelete: Cascade)
}
```

**Use**: Define how objects are mapped between orgs

**Example**:
```json
{
  "id": "objmap123",
  "dataMigrationId": "mig123",
  "sourceObject": "Account",
  "targetObject": "Account__c",
  "fieldMappings": {
    "Id": "ExternalId__c",
    "Name": "Name__c",
    "Phone": "Phone__c"
  }
}
```

---

### 5. FieldMapping

Individual field mappings with type information.

```typescript
model FieldMapping {
  id              String   @id @default(cuid())
  registeredOrgId String
  objectName      String
  sourceField     String
  targetField     String
  fieldType       String
  isRequired      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  registeredOrg   RegisteredOrg @relation(fields: [registeredOrgId], references: [id], onDelete: Cascade)
}
```

**Use**: Detailed field-level mapping information

**Example**:
```json
{
  "id": "fieldmap123",
  "registeredOrgId": "org123",
  "objectName": "Account",
  "sourceField": "Phone",
  "targetField": "Phone__c",
  "fieldType": "Phone",
  "isRequired": false
}
```

---

### 6. AuditLog

Comprehensive audit trail of all operations.

```typescript
model AuditLog {
  id        String   @id @default(cuid())
  action    String
  resource  String
  details   Json?
  ipAddress String?
  userId    String?
  createdAt DateTime @default(now())
}
```

**Actions**: MIGRATION_STARTED, MIGRATION_COMPLETED, OBJECT_DEPLOYED, FIELD_CREATED, etc.

**Use**: Track all system operations for compliance

**Example**:
```json
{
  "id": "audit123",
  "action": "MIGRATION_STARTED",
  "resource": "DataSchedule:a15xx000000001",
  "details": {
    "sourceOrg": "prod",
    "targetOrg": "sandbox"
  },
  "ipAddress": "192.168.1.1",
  "userId": "user123",
  "createdAt": "2024-12-11T10:00:00Z"
}
```

---

### 7. PermissionSet

Permission set definitions.

```typescript
model PermissionSet {
  id              String   @id @default(cuid())
  name            String   @unique
  description     String?
  permissions     Json
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Use**: Store permission set configurations

**Example**:
```json
{
  "id": "ps123",
  "name": "CustomPermission",
  "description": "Custom permissions for admins",
  "permissions": {
    "viewAllRecords": true,
    "editAllRecords": true
  }
}
```

---

### 8. Profile

Profile definitions.

```typescript
model Profile {
  id              String   @id @default(cuid())
  name            String   @unique
  description     String?
  permissions     Json
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Use**: Store profile configurations

**Example**:
```json
{
  "id": "prof123",
  "name": "Admin",
  "description": "Administrator profile",
  "permissions": {
    "viewSetup": true,
    "manageUsers": true
  }
}
```

---

## Relationships Diagram

```
RegisteredOrg (1) ──────── (N) DataMigration (sourceOrg)
RegisteredOrg (1) ──────── (N) DataMigration (targetOrg)
RegisteredOrg (1) ──────── (N) FieldMapping

DataMigration (1) ──────── (N) MigrationLog
DataMigration (1) ──────── (N) ObjectMapping
```

---

## Indexes

For performance optimization, the following indexes are created:

- `RegisteredOrg.domainName` (UNIQUE)
- `DataMigration.dataScheduleId` (UNIQUE)
- `DataMigration.status`
- `DataMigration.sourceOrgId`
- `DataMigration.targetOrgId`
- `MigrationLog.dataMigrationId`
- `MigrationLog.objectName`
- `ObjectMapping.dataMigrationId`
- `FieldMapping.registeredOrgId`
- `FieldMapping.objectName`
- `AuditLog.action`
- `AuditLog.createdAt`

---

## Common Queries

### Get Migration History

```typescript
const migrations = await prisma.dataMigration.findMany({
  where: { sourceOrgId: "org123" },
  include: {
    migrationLogs: true,
    objectMappings: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

### Get Migration Details with Logs

```typescript
const migration = await prisma.dataMigration.findUnique({
  where: { dataScheduleId: "schedule_id" },
  include: {
    sourceOrg: true,
    targetOrg: true,
    migrationLogs: {
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

### Get Audit Trail

```typescript
const auditLog = await prisma.auditLog.findMany({
  where: { action: "MIGRATION_COMPLETED" },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

### Get Object Mappings

```typescript
const mappings = await prisma.objectMapping.findMany({
  where: { dataMigrationId: "mig123" },
  include: { dataMigration: true },
});
```

---

## Data Migration Steps

1. **Create RegisteredOrg** entries for source and target
2. **Create DataMigration** record to track the job
3. **Create ObjectMapping** entries for each object
4. **Create FieldMapping** entries for each field
5. **Update MigrationLog** as data is processed
6. **Create AuditLog** entries for tracking
7. **Update DataMigration.status** when complete

---

## Cascade Deletes

When a DataMigration is deleted:
- Related MigrationLog records are deleted
- Related ObjectMapping records are deleted

When a RegisteredOrg is deleted:
- Related FieldMapping records are deleted

---

## Data Retention

- Audit logs: Keep indefinitely for compliance
- Migration logs: Keep for at least 1 year
- Temporary data: Clean up after 30 days if marked as temporary

---

For migration examples, see [API.md](API.md)
