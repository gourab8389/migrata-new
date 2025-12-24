# Database Schema and Models (canonical)

This file documents the Prisma schema in `prisma/schema.prisma`. The new TypeScript server uses Prisma + PostgreSQL; the snippets below are the authoritative shapes used by the application.

> Source: `prisma/schema.prisma`

## Key models (selected)

### `RegisteredOrg`
Stores Salesforce organization credentials and connection information.

```prisma
model RegisteredOrg {
  id            String   @id @default(cuid())
  domainName    String   @unique
  instanceUrl   String   @unique
  accessToken   String
  refreshToken  String?
  orgId         String?
  userId        String?
  userName      String?
  userEmail     String?
  profileId     String?
  profileName   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations to logs and operations
  dataMigrations        DataMigration[]
  targetMigrations      DataMigration[] @relation("targetOrg")
  fieldMappings         FieldMapping[]
  migrateDataLogs       MigrateDataLog[]
  createCustomFieldLogs CreateCustomFieldLog[]
  updateExtIdValueLogs  UpdateExtIdValueLog[]
  deleteCustomFieldLogs DeleteCustomFieldLog[]
  permitLogs            PermitObjectsAndFieldsLog[]
  recordCountLogs       RecordCountLog[]
  fieldDiffLogs         FieldDifferenceLog[]
  deployFieldDiffLogs   DeployFromFieldDiffLog[]
  duplicateRecordsLogs  DuplicateRecordsLog[]
  csvDataLogs           CsvDataLog[]
  extraChildRecordsLogs ExtraChildRecordsLog[]
  syncRecordsLogs       SyncRecordsLog[]
  metadataDeployLogs    MetadataDeployLog[]
  diffViewerLogs        DiffViewerLog[]
  errorLogs             ErrorLog[]

  @@index([domainName])
  @@index([orgId])
}
```

### `DataMigration`
Tracks migration jobs. `dataScheduleId` is unique and used widely as an external identifier.

```prisma
model DataMigration {
  id                String   @id @default(cuid())
  dataScheduleId    String   @unique
  status            String   @default("Pending")
  sourceOrgId       String?
  targetOrgId       String?
  dataBatchId       String?
  scheduledStartTime DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  sourceOrg      RegisteredOrg? @relation(fields: [sourceOrgId], references: [id], onDelete: SetNull)
  targetOrg      RegisteredOrg? @relation("targetOrg", fields: [targetOrgId], references: [id], onDelete: SetNull)
  migrationLogs  MigrationLog[]
  objectMappings ObjectMapping[]

  @@index([sourceOrgId])
  @@index([targetOrgId])
  @@index([status])
  @@index([dataScheduleId])
}
```

### `MigrationLog` and `ObjectMapping` (selected fields)

```prisma
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

  dataMigration DataMigration @relation(fields: [dataMigrationId], references: [id], onDelete: Cascade)
}

model ObjectMapping {
  id              String   @id @default(cuid())
  dataMigrationId String
  sourceObject    String
  targetObject    String
  fieldMappings   Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now())
}
```

### Log models (summary)
There are many operation-specific log models (e.g. `CreateCustomFieldLog`, `UpdateExtIdValueLog`, `FieldDifferenceLog`, `MigrateDataLog`, etc.). They commonly use `dataScheduleId` (often `@unique`) and `Json` columns for flexible nested payloads such as `result`, `differences`, `recordCounts`, etc.

## Indexes & Uniqueness
- Many models index `dataScheduleId` and set it `@unique` when the model represents a single async job per schedule.
- `RegisteredOrg.domainName` and `RegisteredOrg.instanceUrl` are unique.

## Notes for porting / compatibility
- Mongo dotted-path updates (legacy `logCursor.updateOne(... { $set: { [`result.${org}`]: ... } })`) are implemented with JSON fields in Postgres; code performs read-modify-write or raw JSONB operations in helpers. Search for places that compute dynamic keys (``[`result.${org}`]``) when reviewing behavior.
- Ensure Prisma migrations are applied (`npm run prisma:migrate` / `npm run prisma:push`) before running the server.

## Common Prisma queries (examples)
See `src/services` and `src/helpers` for runtime usage. Examples:

```ts
const migration = await prisma.dataMigration.findUnique({
  where: { dataScheduleId: "schedule_id" },
  include: { sourceOrg: true, targetOrg: true, migrationLogs: true },
});
```

---

If you want a line-by-line mapping of every `db.collection("X")` used in the legacy server to the exact Prisma model, I can generate that next.

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
