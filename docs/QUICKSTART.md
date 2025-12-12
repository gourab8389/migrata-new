# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Salesforce Developer Account

### Step 1: Clone and Install
```bash
cd migrata-new
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/migrata_db"
MIGRATA_CLIENT_ID=your_client_id
MIGRATA_CLIENT_SECRET=your_client_secret
```

### Step 3: Setup Database
```bash
npm run prisma:push
npm run prisma:generate
```

### Step 4: Start Server
```bash
npm run dev
```

Visit: http://localhost:8080

---

## Testing APIs

### Option 1: Using curl

```bash
# Health check
curl http://localhost:8080/api/v1/health

# Get CSRF token
curl http://localhost:8080/csrf-token

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"password"}'
```

### Option 2: Import Postman Collection

1. Open Postman
2. Click "Import"
3. Select: `docs/postman/Migrata-API-Collection.json`
4. Test endpoints

### Option 3: Use Thunder Client (VS Code)

1. Install Thunder Client extension
2. Import collection from same file
3. Test directly in VS Code

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Build TypeScript to JS |
| `npm start` | Start production server |
| `npm run prisma:studio` | Open database UI |
| `npm run prisma:migrate` | Create migrations |
| `npm run prisma:push` | Sync schema to DB |

---

## Project Structure Overview

```
src/
├── app.ts           # Express setup
├── server.ts        # Start server
├── types/           # TypeScript types
├── config/          # Configuration
├── controllers/     # Business logic
├── routes/          # API routes
├── services/        # Salesforce integration
├── helpers/         # Utilities
└── utils/           # Common functions
```

---

## Key Files

- **Types**: `src/types/index.ts` - All interfaces
- **Database**: `prisma/schema.prisma` - Data models
- **API**: `src/routes/api/v1/` - Endpoints
- **Docs**: `docs/API.md` - Full documentation

---

## Add New Endpoint

1. Create controller: `src/controllers/api/v1/newController.ts`
2. Create route: `src/routes/api/v1/new.ts`
3. Register in: `src/routes/api/v1/index.ts`
4. Add types in: `src/types/index.ts`

---

## Database Operations

### View Database
```bash
npm run prisma:studio
```

### Create Migration
```bash
# Edit prisma/schema.prisma
npm run prisma:migrate -- --name add_new_field
```

### Reset Database (dev only)
```bash
npx prisma migrate reset
```

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | DB connection | `postgresql://...` |
| `MIGRATA_CLIENT_ID` | Salesforce ID | - |
| `MIGRATA_CLIENT_SECRET` | Salesforce secret | - |
| `SESSION_SECRET` | Session key | random string |

---

## Troubleshooting

**Port already in use?**
```bash
# Change in .env
PORT=3000
```

**Database connection error?**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Test connection: psql <url>
```

**Module not found?**
```bash
npm install
npm run build
npm run prisma:generate
```

---

## Next Steps

1. ✅ Server running
2. ✅ Database connected
3. 📝 Read `docs/API.md` for endpoints
4. 📝 Read `docs/DATABASE.md` for schema
5. 📝 Read `docs/SETUP.md` for detailed setup
6. 🧪 Test with Postman collection
7. 💻 Implement custom endpoints
8. 🚀 Deploy to production

---

## Support & Docs

- **Full API Docs**: [docs/API.md](docs/API.md)
- **Database Schema**: [docs/DATABASE.md](docs/DATABASE.md)
- **Setup Guide**: [docs/SETUP.md](docs/SETUP.md)
- **Main README**: [README.md](README.md)

---

## Quick Links

- Server: http://localhost:8080
- Health Check: http://localhost:8080/api/v1/health
- Prisma Studio: `npm run prisma:studio`
- Postman Collection: `docs/postman/Migrata-API-Collection.json`

---

Happy coding! 🚀
