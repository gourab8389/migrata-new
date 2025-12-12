# Migrata - Salesforce Data Migration Tool

A comprehensive TypeScript-based Salesforce data migration tool with full support for data export, import, field mapping, and advanced Salesforce operations.

## Features

- **TypeScript First**: Full type safety with comprehensive type definitions
- **Prisma ORM**: Modern database abstraction with PostgreSQL
- **Data Migration**: Export and import Salesforce data securely
- **Field Mapping**: Intelligent field mapping between source and target organizations
- **Permission Management**: Permission set and profile management
- **Audit Logging**: Complete audit trail of all operations
- **RESTful API**: Comprehensive API endpoints for all operations
- **Production Ready**: Built with scalability and reliability in mind

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript 5.9+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Salesforce OAuth2
- **Validation**: Request validation and type safety

## Prerequisites

- Node.js 18.0 or higher
- PostgreSQL 12 or higher
- Salesforce Developer Account with API access
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd migrata-new
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your PostgreSQL connection and Salesforce credentials in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/migrata_db"
MIGRATA_CLIENT_ID=your_salesforce_client_id
MIGRATA_CLIENT_SECRET=your_salesforce_client_secret
```

5. Initialize the database:

```bash
npm run prisma:push
npm run prisma:generate
```

## Development

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma` - Access Prisma CLI
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:push` - Push database schema changes
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Run TypeScript compiler check

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Migration
- `POST /api/v1/migrate-data` - Initiate data migration
- `GET /api/v1/migrate-data/status/:dataScheduleId` - Get migration status
- `POST /api/v1/migrate-data/deploy` - Deploy migration

### Metadata
- `GET /api/v1/metadata/objects` - List objects
- `GET /api/v1/metadata/object/:objectName` - Get object details
- `POST /api/v1/metadata/describe` - Describe objects

### Field Operations
- `GET /api/v1/field-difference/:dataScheduleId` - Get field differences
- `POST /api/v1/field-difference/view` - View field differences
- `GET /api/v1/object-fields/:sourceOrgId/:objectName` - Get object fields

### Records
- `GET /api/v1/records-count/:sourceOrgId/:objectName` - Get record count
- `POST /api/v1/records-count/count` - Count records
- `POST /api/v1/sync-records` - Sync records
- `GET /api/v1/sync-records/:dataScheduleId` - Get sync status

### Permissions
- `POST /api/v1/permission-set/assign` - Assign permission set
- `POST /api/v1/permission-set/fetch-id` - Fetch permission set ID
- `POST /api/v1/permission-set/fetch-list` - Fetch permission set list

### External ID
- `POST /api/v1/ext-id/check-status` - Check external ID status
- `POST /api/v1/ext-id/create-field` - Create external ID field
- `POST /api/v1/ext-id/delete-field` - Delete external ID field
- `POST /api/v1/ext-id/fetch-name` - Fetch external ID name

### Logs
- `GET /api/v1/logs/:dataScheduleId` - Get migration logs
- `GET /api/v1/logs/object/:objectName/:dataScheduleId` - Get object logs

### Utilities
- `GET /` - Health check
- `GET /csrf-token` - Get CSRF token
- `GET /api/v1/health` - API health status

## Database Schema

The application uses Prisma ORM with the following main models:

- **RegisteredOrg**: Salesforce organization credentials
- **DataMigration**: Migration job tracking
- **MigrationLog**: Detailed migration logs per object
- **ObjectMapping**: Field mappings between objects
- **FieldMapping**: Individual field mappings
- **AuditLog**: Operation audit trail
- **PermissionSet**: Permission set definitions
- **Profile**: Profile definitions

## Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── types/
│   └── index.ts          # TypeScript type definitions
├── config/
│   ├── database.ts       # Prisma client configuration
│   └── middleware.ts     # Express middleware setup
├── controllers/
│   └── api/v1/           # API controllers
├── routes/
│   └── api/v1/           # API routes
├── services/
│   └── sfdc/             # Salesforce integration services
├── helpers/              # Utility helper functions
└── utils/                # Common utilities
```

## Environment Variables

See `.env.example` for all available configuration options:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection string
- `MIGRATA_CLIENT_ID` - Salesforce OAuth2 client ID
- `MIGRATA_CLIENT_SECRET` - Salesforce OAuth2 client secret
- `MIGRATA_NAMESPACE` - Custom namespace for Salesforce objects
- `SESSION_SECRET` - Session encryption secret

## Error Handling

The application includes comprehensive error handling:

- Standardized error responses
- Detailed error logging
- Graceful shutdown handling
- Database connection error management

## Security Features

- CORS protection
- Helmet.js security headers
- CSRF token protection
- Input validation and sanitization
- SQL injection prevention
- Secure session management
- Environment variable protection

## Performance Optimization

- Connection pooling
- Query optimization
- Request logging with rotating files
- Efficient database queries with indexes
- Graceful error handling

## Scalability

- Modular route structure
- Service layer architecture
- Prisma for efficient database operations
- Support for load balancing
- Proper logging and monitoring hooks

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

## License

ISC

## Version

2.0.0 - TypeScript + Prisma + PostgreSQL
