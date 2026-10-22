import { prisma } from "../db.js";
import { getSubscriptionId } from "./subscriptionController.js";

const find = async (req, res) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.user.id,
    },
    include: {
      subscription: {
        include: { plan: true },
      },
      business: { include: { logo: true } },
      clients: true,
      mailsendToken: {
        select: { scopes: true },
      },
      invoices: {
        orderBy: { id: "desc" },
        include: { client: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.lastInvoiceNumber = user.invoices[0]?.invoiceNumber;

  user.accessScopes = user.mailsendToken?.scopes || [];
  delete user.mailsendToken;

  res.status(200).json(user);
};

const deleteUser = async (req, res) => {
  const user = await prisma.user.update({
    where: {
      uq_email_status: {
        email: req.user.email,
        status: "ACTIVE",
      },
    },
    data: { deletedAt: new Date(), status: "DELETED" },
    include: { subscription: { include: { plan: true } } },
  });

  if (user.subscription.plan.name !== "free") {
    const subId = await getSubscriptionId(req.user.email);
    if (!subId)
      return res
        .status(400)
        .json({ message: "You have no active subcription" });
    await fetch(
      `https://api.flutterwave.com/v3/subscriptions/${subId}/cancel`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
  }

  res.status(204).end();
};

export default { find, deleteUser };
