import { LedgerStatus } from "@prisma/client";
import { prisma } from "../db.js";

async function create(event) {
  const {
    data: {
      customer: { email },
      subscription: { subscription_id },
      invoice_id,
      amount_paid,
      period_start,
      period_end,
      created_at,
    },
  } = event;

  await prisma.ledgerEntry.create({
    data: {
      user: {
        connect: {
          uq_email_status: { email, status: "ACTIVE" },
        },
      },
      amount: parseInt(amount_paid),
      status: LedgerStatus.PAID,
      externalTransactionId: invoice_id,
      periodStart: period_start,
      periodEnd: period_end,
      createdAt: created_at,
    },
  });
}

export default { create };
