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
