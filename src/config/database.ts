import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

let prisma: PrismaClient;

const baseOptions: any = {
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  adapter: new PrismaPg({
    url: process.env.DATABASE_URL,
  }),
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(baseOptions);
} else {
  let globalWithPrisma = global as typeof global & {
    prisma: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient(baseOptions);
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;