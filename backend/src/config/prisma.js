require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
}

const prisma = globalThis.__spaPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__spaPrisma = prisma;
}

module.exports = prisma;
