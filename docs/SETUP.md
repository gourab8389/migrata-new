# Setup and Development Guide

## Prerequisites Installation

### 1. Install Node.js

Download and install Node.js 18.0 or higher from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

### 2. Install PostgreSQL

Download and install PostgreSQL 12 or higher from [postgresql.org](https://www.postgresql.org/download/)

Create a new database:
```bash
createdb migrata_db
```

### 3. Setup Salesforce Developer Account

1. Create a Salesforce Developer Account at [developer.salesforce.com](https://developer.salesforce.com)
2. Install the Migrata managed package or custom app
3. Create OAuth2 credentials:
   - Go to Setup → Apps → App Manager
   - Create New → Connected App
   - Set up OAuth scopes
   - Note down Client ID and Client Secret

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd migrata-new
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=8080

DATABASE_URL="postgresql://user:password@localhost:5432/migrata_db"

MIGRATA_CLIENT_ID=your_salesforce_client_id
MIGRATA_CLIENT_SECRET=your_salesforce_client_secret
MIGRATA_NAMESPACE=Migrata__

CONSOLE_ORG_DOMAIN_NAME=console.salesforce.com
REDIRECT_URI=http://localhost:8080/auth/callback

SESSION_SECRET=your_secure_session_secret

LOG_LEVEL=debug
```

### 4. Initialize Database

Generate Prisma Client:
```bash
npm run prisma:generate
```

Push schema to database:
```bash
npm run prisma:push
```

View database in Prisma Studio:
```bash
npm run prisma:studio
```

### 5. Start Development Server

```bash
npm run dev
```

Server will be available at: `http://localhost:8080`

## Project Structure Guide

```
migrata-new/
├── src/
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # Server entry point
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces
│   ├── config/
│   │   ├── database.ts        # Prisma configuration
│   │   └── middleware.ts      # Express middleware
│   ├── controllers/
│   │   └── api/v1/            # Request handlers
│   ├── routes/
│   │   └── api/v1/            # API route definitions
│   ├── services/
│   │   └── sfdc/              # Salesforce integration
│   ├── helpers/               # Utility functions
│   └── utils/                 # Common utilities
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/
│   ├── API.md                 # API documentation
│   ├── postman/               # Postman collection
│   └── SETUP.md              # This file
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Common Development Tasks

### Add a New API Endpoint

1. Create controller in `src/controllers/api/v1/nameController.ts`
2. Create route in `src/routes/api/v1/name.ts`
3. Import and register route in `src/routes/api/v1/index.ts`
4. Add types in `src/types/index.ts`

### Add a New Database Model

1. Edit `prisma/schema.prisma`
2. Create migration:
```bash
npm run prisma:migrate -- --name add_new_model
```
3. Generate Prisma Client:
```bash
npm run prisma:generate
```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Start Production Server

```bash
npm start
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `development` \| `production` |
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost/db` |
| `MIGRATA_CLIENT_ID` | Salesforce OAuth Client ID | - |
| `MIGRATA_CLIENT_SECRET` | Salesforce OAuth Client Secret | - |
| `MIGRATA_NAMESPACE` | Custom namespace prefix | `Migrata__` |
| `CONSOLE_ORG_DOMAIN_NAME` | Console org domain | `console.salesforce.com` |
| `REDIRECT_URI` | OAuth redirect URL | `http://localhost:8080/auth/callback` |
| `SESSION_SECRET` | Session encryption key | - |
| `LOG_LEVEL` | Logging level | `debug` \| `info` \| `warn` \| `error` |

## Troubleshooting

### PostgreSQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct

```bash
psql postgres
```

### Prisma Migration Issues

```
Error: Migration is locked
```

**Solution**: Reset migrations (development only)

```bash
npm run prisma:migrate -- --skip-generate
```

### Port Already in Use

```
Error: listen EADDRINUSE :::8080
```

**Solution**: Change PORT in `.env` or kill process on port 8080

### Module Not Found Errors

```bash
npm install
npm run build
```

## Testing API Endpoints

### Using curl

```bash
curl -X GET http://localhost:8080/api/v1/health
```

### Using Postman

1. Import collection from `docs/postman/Migrata-API-Collection.json`
2. Set base URL to `http://localhost:8080`
3. Test endpoints

### Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create new request
3. Test API endpoints

## Performance Tips

1. **Use indexes**: All frequently queried fields have database indexes
2. **Pagination**: Use pagination for large result sets
3. **Connection pooling**: Prisma handles connection pooling automatically
4. **Query optimization**: Use select to only fetch needed fields

Example:
```typescript
const users = await prisma.user.findMany({
  select: { id: true, name: true },
  take: 10,
  skip: 0,
});
```

## Security Best Practices

1. Never commit `.env` file
2. Use environment variables for secrets
3. Validate all inputs
4. Use HTTPS in production
5. Implement rate limiting
6. Keep dependencies updated

```bash
npm audit
npm update
```

## Debugging

### Enable Debug Logging

Set in `.env`:
```
LOG_LEVEL=debug
```

### Use VS Code Debugger

Add `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

## Next Steps

1. Configure Salesforce OAuth credentials
2. Set up database with real data
3. Test API endpoints with Postman
4. Implement missing controllers
5. Add unit tests
6. Deploy to production

For more details, see [API.md](API.md) and [README.md](../README.md)
