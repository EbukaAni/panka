import { prisma } from "../db.js";

export async function canAddRecurringInvoice(req, res, next) {
  const sub = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    select: {
      plan: {
        select: {
          planFeatures: {
            select: { value: true, feature: { select: { name: true } } },
          },
        },
      },
    },
  });

  const limit = sub.plan.planFeatures.find(
    ({ feature }) => feature.name == "recurringLimit",
  ).value;
  const invoiceCount = await prisma.recurringInvoice.count({
    where: { userId: req.user.id },
  });

  if (invoiceCount >= limit) {
    return res
      .status(400)
      .json({ message: "limit reached can not add more recurring invoices" });
  }
  next();
}
