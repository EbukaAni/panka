import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000,
});
const prisma = new PrismaClient({ adapter });

const features = [
  {
    name: "PdfExport",
    type: "BOOLEAN",
    description: "Access to pdf exports",
  },
  {
    name: "saveToDrive",
    type: "BOOLEAN",
    description: "Acess to save invoice to google drive",
  },
  {
    name: "mailToClient",
    type: "BOOLEAN",
    description: "Acess to mail invoice to user",
  },
  {
    name: "recurringLimit",
    type: "LIMIT",
    description: "Number of recurring invoices a for plan",
  },
];

const plans = [
  {
    name: "Free",
    price: 0,
    description: "For getting started",
    features: {
      PdfExport: "true",
      saveToDrive: "true",
      mailToClient: "true",
      recurringLimit: "0",
    },
  },
  {
    name: "Pro",
    price: 2,
    providerId: "246528",
    description: "For businesses that want automation",
    features: {
      PdfExport: "true",
      saveToDrive: "true",
      mailToClient: "true",
      recurringLimit: "40",
    },
  },
];

async function main() {
  // 1. Features
  for (const f of features) {
    const res = await prisma.feature.upsert({
      where: { name: f.name },
      update: { type: f.type, description: f.description },
      create: f,
    });
  }

  const featureRows = await prisma.feature.findMany();
  const featureIdByName = new Map(featureRows.map((f) => [f.name, f.id]));

  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { name: p.name },
      update: { price: p.price, description: p.description },
      create: {
        name: p.name,
        providerId: p.providerId ?? null,
        price: p.price,
        description: p.description,
      },
    });

    for (const [featureName, value] of Object.entries(p.features)) {
      const featureId = featureIdByName.get(featureName);
      if (!featureId) throw new Error(`Unknown feature: ${featureName}`);

      await prisma.planFeatures.upsert({
        where: { planId_featureId: { planId: plan.id, featureId } },
        update: { value },
        create: { planId: plan.id, featureId, value },
      });
    }
  }
}

main()
  .then(() => console.log("Seeded"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
