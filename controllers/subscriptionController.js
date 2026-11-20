import crypto from "crypto";
import { prisma } from "../db.js";
import { Bachs } from "@bachs/sdk";
import { SubscriptionStatus } from "@prisma/client";

export const bachs = new Bachs({
  apiKey: process.env.BACHS_KEY,
});

async function subscribe(req, res) {
  const plan = await prisma.plan.findFirst({
    where: { name: req.query.plan },
    select: { name: true, price: true, providerId: true },
  });
  if (!plan || plan.name == "Free") {
    return res.redirect("/");
  }

  if (!req.user) {
    const url = new URLSearchParams({
      returnTo: `/subscribe?plan=${plan.name}`,
    });
    return res.redirect(`/auth/google?${url}`);
  }
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    include: { plan: { select: { name: true } } },
  });
  if (subscription?.plan?.name == plan.name) {
    return res.redirect("/dashboard");
  }

  const checkout = await bachs.checkoutSessions.create(
    {
      product_cart: [{ product_id: plan.providerId }],
      customer: { email: req.user.email, name: req.user.name },
      success_url: `${process.env.TUNNEL_URL || process.env.APP_URL}/subscription/success`,
    },
    { idempotencyKey: `checkout-${crypto.randomUUID()}` },
  );

  res.redirect(checkout.checkout_url);
}

async function create(event) {
  const {
    data: {
      customer: { email },
      subscription_id,
      current_period_start,
      current_period_end,
      product_id,
    },
  } = event;
  // console.log(event);

  await prisma.subscription.create({
    data: {
      providerId: subscription_id,
      status: "ACTIVE",
      startDate: current_period_start,
      endDate: current_period_end,
      plan: { connect: { providerId: product_id } },
      user: {
        connect: {
          uq_email_status: {
            email,
            status: "ACTIVE",
          },
        },
      },
    },
  });
}

async function requestCancelation(req, res) {
  const sub = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    include: { plan: true },
  });

  if (sub.plan.name !== "Pro")
    return res
      .status(409)
      .json({ error: "Can not cancel a free subscription" });

  try {
    await bachs.subscriptions.cancel(sub.providerId, {
      cancel_at_period_end: true,
      reason: "Customer requested",
    });
    return res.json({ status: "cancellation requested" });
  } catch (err) {
    console.log(err);
    if (err.outcomeUnknown) {
      return res
        .status(503)
        .json({ error: "Could not confirm, please check again shortly" });
    }
    console.error("Cancel failed", { status: err.status, code: err.errorCode });
    return res.status(500).json({ error: "Could not cancel subscription" });
  }
}

async function cancel(event) {
  const {
    data: { subscription_id, created_at },
  } = event;
  await prisma.subscription.update({
    where: { providerId: subscription_id },
    data: {
      status: SubscriptionStatus.CANCELING,
      updatedAt: created_at,
    },
  });
}

export async function getSubscriptionId(email) {
  const res = await fetch(
    `https://api.flutterwave.com/v3/subscriptions?email=${email}`,
    {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    },
  );
  const response = await res.json();
  const sub =
    response.data.find((s) => s.status === "active") || response.data[0];
  return sub?.id;
}

export default {
  subscribe,
  create,
  requestCancelation,
  cancel,
};
