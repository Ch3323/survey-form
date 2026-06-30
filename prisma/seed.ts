import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

if (!adminUsername) {
  throw new Error("ADMIN_USERNAME is required to seed an admin account.");
}

if (!adminPassword) {
  throw new Error("ADMIN_PASSWORD is required to seed an admin account.");
}

if (adminPassword.length < 8) {
  throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
}

if (!/^[a-z0-9_.]+$/.test(adminUsername)) {
  throw new Error(
    "ADMIN_USERNAME can only contain letters, numbers, underscores, and dots.",
  );
}

const seededAdminUsername = adminUsername;
const seededAdminEmail = adminEmail ?? `${adminUsername}@admin.local`;
const seededAdminPassword = adminPassword;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const passwordHash = await hashPassword(seededAdminPassword);
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: seededAdminUsername }, { email: seededAdminEmail }],
    },
    select: { id: true },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: seededAdminEmail,
          username: seededAdminUsername,
          displayUsername: seededAdminUsername,
          name: adminName,
          role: "admin",
          banned: false,
          banReason: null,
          banExpires: null,
        },
      })
    : await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: seededAdminEmail,
          username: seededAdminUsername,
          displayUsername: seededAdminUsername,
          name: adminName,
          emailVerified: true,
          role: "admin",
          banned: false,
        },
      });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: adminName,
      emailVerified: true,
      role: "admin",
      banned: false,
      banReason: null,
      banExpires: null,
    },
  });

  const existingCredentialAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
    select: { id: true },
  });

  if (existingCredentialAccount) {
    await prisma.account.update({
      where: { id: existingCredentialAccount.id },
      data: {
        accountId: user.id,
        password: passwordHash,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        id: `credential:${user.id}`,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
        userId: user.id,
      },
    });
  }

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      impersonatedBy: null,
    },
  });

  console.log(`Seeded admin account: ${user.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
