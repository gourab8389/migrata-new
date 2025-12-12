# API Documentation

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

All endpoints except `/csrf-token` may require authentication. Use Bearer tokens obtained from the login endpoint.

## Response Format

All responses follow a standard format:

```json
{
  "success": true|false,
  "message": "string",
  "data": {}
}
```

## Endpoints

### 1. Authentication Endpoints

#### Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticate user and get access token
- **Request Body**:
```json
{
  "username": "user@example.com",
  "password": "password"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
  }
}
```

#### Refresh Token
- **Endpoint**: `POST /auth/refresh-token`
- **Description**: Refresh access token using refresh token
- **Request Body**:
```json
{
  "refreshToken": "refresh_token"
}
```

#### Logout
- **Endpoint**: `POST /auth/logout`
- **Description**: Logout user and invalidate session

---

### 2. Migration Endpoints

#### Initiate Migration
- **Endpoint**: `POST /migrate-data`
- **Description**: Start a new data migration job
- **Request Body**:
```json
{
  "dataScheduleId": "schedule_id",
  "dataBatchIds": ["batch_id_1", "batch_id_2"],
  "test": false
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Migration initiated successfully",
  "dataMigrationId": "migration_id",
  "data": {
    "dataMigrationId": "migration_id",
    "status": "InProgress"
  }
}
```

#### Get Migration Status
- **Endpoint**: `GET /migrate-data/status/:dataScheduleId`
- **Description**: Get current status of a migration
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "migration_id",
    "dataScheduleId": "schedule_id",
    "status": "InProgress",
    "sourceOrgId": "source_org",
    "targetOrgId": "target_org",
    "createdAt": "2024-12-11T00:00:00Z",
    "migrationLogs": []
  }
}
```

#### Deploy Migration
- **Endpoint**: `POST /migrate-data/deploy`
- **Description**: Deploy migration to target organization

---

### 3. Metadata Endpoints

#### List Objects
- **Endpoint**: `GET /metadata/objects`
- **Description**: Get list of available Salesforce objects
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Account",
      "label": "Account",
      "fields": []
    }
  ]
}
```

#### Get Object Details
- **Endpoint**: `GET /metadata/object/:objectName`
- **Description**: Get detailed information about a specific object
- **Response**:
```json
{
  "success": true,
  "data": {
    "objectName": "Account",
    "fields": [
      {
        "name": "Id",
        "type": "string",
        "required": true
      }
    ]
  }
}
```

#### Describe Objects
- **Endpoint**: `POST /metadata/describe`
- **Description**: Get detailed description of multiple objects
- **Request Body**:
```json
{
  "objectNames": ["Account", "Contact"]
}
```

---

### 4. Field Difference Endpoints

#### Get Field Differences
- **Endpoint**: `GET /field-difference/:dataScheduleId`
- **Description**: Get field differences between source and target
- **Response**:
```json
{
  "success": true,
  "data": {
    "dataScheduleId": "schedule_id",
    "differences": [
      {
        "objectName": "Account",
        "addedFields": ["NewField__c"],
        "removedFields": [],
        "modifiedFields": []
      }
    ]
  }
}
```

#### View Differences
- **Endpoint**: `POST /field-difference/view`
- **Description**: View detailed field differences

---

### 5. Records Endpoints

#### Get Record Count
- **Endpoint**: `GET /records-count/:sourceOrgId/:objectName`
- **Description**: Count records in source organization
- **Response**:
```json
{
  "success": true,
  "data": {
    "sourceOrgId": "org_id",
    "objectName": "Account",
    "recordCount": 100
  }
}
```

#### Count Records
- **Endpoint**: `POST /records-count/count`
- **Description**: Count records with filters
- **Request Body**:
```json
{
  "sourceOrgId": "org_id",
  "objectName": "Account",
  "whereClause": "WHERE Status='Active'"
}
```

---

### 6. Permission Set Endpoints

#### Assign Permission Set
- **Endpoint**: `POST /permission-set/assign`
- **Description**: Assign permission set to users
- **Request Body**:
```json
{
  "permissionSetName": "CustomPermission",
  "userIds": ["user_id_1", "user_id_2"]
}
```

#### Fetch Permission Set ID
- **Endpoint**: `POST /permission-set/fetch-id`
- **Description**: Get permission set ID by name
- **Request Body**:
```json
{
  "permissionSetName": "CustomPermission"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "permissionSetId": "id"
  }
}
```

#### Fetch Permission Sets List
- **Endpoint**: `POST /permission-set/fetch-list`
- **Description**: Get list of all permission sets
- **Response**:
```json
{
  "success": true,
  "data": {
    "permissionSets": [
      {
        "id": "id",
        "name": "PermissionSetName"
      }
    ]
  }
}
```

---

### 7. External ID Endpoints

#### Check External ID Status
- **Endpoint**: `POST /ext-id/check-status`
- **Description**: Check if external ID field exists
- **Request Body**:
```json
{
  "orgId": "org_id",
  "objectName": "Account",
  "extIdField": "ExternalId__c"
}
```

#### Create External ID Field
- **Endpoint**: `POST /ext-id/create-field`
- **Description**: Create external ID field on object
- **Request Body**:
```json
{
  "orgId": "org_id",
  "objectName": "Account",
  "fieldName": "ExternalId__c",
  "label": "External ID"
}
```

#### Delete External ID Field
- **Endpoint**: `POST /ext-id/delete-field`
- **Description**: Delete external ID field
- **Request Body**:
```json
{
  "orgId": "org_id",
  "objectName": "Account",
  "fieldName": "ExternalId__c"
}
```

---

### 8. Logs Endpoints

#### Get Migration Logs
- **Endpoint**: `GET /logs/:dataScheduleId`
- **Description**: Get logs for a specific migration
- **Response**:
```json
{
  "success": true,
  "data": {
    "dataScheduleId": "schedule_id",
    "logs": [
      {
        "id": "log_id",
        "objectName": "Account",
        "recordCount": 100,
        "successCount": 95,
        "failureCount": 5,
        "createdAt": "2024-12-11T00:00:00Z"
      }
    ]
  }
}
```

#### Get Object Logs
- **Endpoint**: `GET /logs/object/:objectName/:dataScheduleId`
- **Description**: Get logs for specific object in a migration

---

### 9. Sync Records Endpoints

#### Initiate Sync
- **Endpoint**: `POST /sync-records`
- **Description**: Initiate record synchronization
- **Request Body**:
```json
{
  "dataScheduleId": "schedule_id",
  "objectNames": ["Account", "Contact"]
}
```

#### Get Sync Status
- **Endpoint**: `GET /sync-records/:dataScheduleId`
- **Description**: Get current sync status

---

### 10. Additional Endpoints

#### Health Check
- **Endpoint**: `GET /`
- **Description**: Server health check
- **Response**:
```json
{
  "msg": "Welcome to Migrata!",
  "version": "2.0.0",
  "status": "running"
}
```

#### CSRF Token
- **Endpoint**: `GET /csrf-token`
- **Description**: Get CSRF token for protected requests
- **Response**:
```json
{
  "token": "encrypted_csrf_token"
}
```

#### API Health
- **Endpoint**: `GET /api/v1/health`
- **Description**: API health status
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-11T00:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict (e.g., migration already running)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, implement based on your requirements.

---

## Pagination

Endpoints that return lists support pagination with `page` and `limit` query parameters:

```
GET /endpoint?page=1&limit=20
```

---

## Filtering

Some endpoints support filtering with query parameters:

```
GET /endpoint?status=active&orgId=org123
```

Refer to individual endpoint documentation for supported filters.
