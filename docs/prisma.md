```markdown
# Prisma setup and run commands

This project uses Prisma (see `prisma/schema.prisma`). Use the project's npm scripts for Prisma operations rather than installing legacy CLI packages.

## Use the project scripts

Install dependencies:

```bash
npm install
```

Generate Prisma Client (required after schema changes):

```bash
npm run prisma:generate
```

Push schema to database (development, non-destructive):

```bash
npm run prisma:push
```

Create a migration (for versioned changes):

```bash
npm run prisma:migrate -- --name add_change
```

Open Prisma Studio (UI):

```bash
npm run prisma:studio
```

## Notes

- The datasource provider in `prisma/schema.prisma` is `postgresql`. To change providers update the `provider` field and `DATABASE_URL` in `.env`.
- Prefer `prisma:push` for quick development syncs and `prisma:migrate` for production-safe, versioned migrations.

## Example `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/migrata_db"
```

``` 
# Prisma setup and run commands

This project uses [Prisma ORM](https://www.prisma.io/) to manage database interactions. Below are the commands to set up and run Prisma in your development environment.

## Setup

1. Install Prisma CLI as a development dependency:

   ```bash
   npm install @prisma/cli --save-dev
   ```

2. Initialize Prisma in your project:

   ```bash
        npx prisma init
   ```
3. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```
4. Push the Prisma schema to your database:

   ```bash
   npx prisma db push
   ```
5. To apply migrations, use:

   ```bash
   npx prisma migrate dev --name init
   ```
6. To open Prisma Studio for database management:

   ```bash
   npx prisma studio
   ```

### Database Change

For chnage the db postgresql to mongodb or sql, update the `provider` field in the `datasource` block of your `prisma/schema.prisma` file accordingly. For example, to switch to MongoDB:

```prisma
datasource db {
  provider = "mongodb" or "postgresql" or "mysql"
}
```

in .env file, update the `DATABASE_URL` to match your new database connection string.
```
DATABASE_URL="mongodb" or "postgresql" or "mysql"://user:password@host:port/database
```
