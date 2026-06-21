import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createEnvMissingError, ApiConnectionError, classifyProviderError } from "../http/api-error";

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

export function isDatabaseConfigured() {
  return Boolean(getServerEnv("DATABASE_URL"));
}

export function assertDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw createEnvMissingError("database", ["DATABASE_URL"]);
  }
}

export async function testDatabaseConnection() {
  assertDatabaseConfigured();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const classified = classifyProviderError(error, "database");
    throw new ApiConnectionError({
      code: classified.code === "ENDPOINT_ERROR" ? "DATABASE_CONNECTION_FAILED" : classified.code,
      provider: "database",
      status: "FAILED",
      statusCode: 503,
      message: "database connection failed.",
      technicalReason: classified.technicalReason
    });
  }
}

function createMissingDatabaseClient() {
  return new Proxy(
    {},
    {
      get() {
        throw createEnvMissingError("database", ["DATABASE_URL"]);
      }
    }
  ) as PrismaClient;
}
