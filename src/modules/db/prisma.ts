import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = getServerEnv("DATABASE_URL");

  if (!connectionString) {
    return createMissingDatabaseClient();
  }

  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

function getServerEnv(key: string) {
  const processEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return processEnv?.[key];
}

function createMissingDatabaseClient() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Database belum dikonfigurasi. Isi DATABASE_URL dan DIRECT_URL lalu jalankan migration/seed.");
      }
    }
  ) as PrismaClient;
}
