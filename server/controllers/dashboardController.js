import { email } from "zod";
import { prisma } from "../db.js";

const getData = async (req, res) => {
  const userId = req.user.id;
  const data = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      picture: true,
      subscription: {
        select: {
          status: true,
          endDate: true,
          plan: {
            select: {
              name: true,
              price: true,
              planFeatures: {
                select: { value: true, feature: { select: { name: true } } },
              },
            },
          },
        },
      },
      card: true,
      ledgerEntries: {
        select: { amount: true, createdAt: true, status: true, id: true },
      },
    },
  });

  const recurInvAggregate = await prisma.recurringInvoice.aggregate({
    _count: { id: true },
    _sum: { sentCount: true },
    where: { userId },
  });
  const invoiceCount = await prisma.invoice.count({ where: { userId } });
  const usage = await prisma.recurringInvoice.count({ where: { userId } });
  res.status(200).json({
    ...data,
    invoiceCount,
    usage,
    recurringInvoice: {
      count: recurInvAggregate._count.id,
      sent: recurInvAggregate._sum.sentCount ?? 0,
    },
  });
};

export default { getData };
