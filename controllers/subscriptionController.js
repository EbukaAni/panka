import { matchedData } from "express-validator";
import crypto from "crypto";
import { prisma } from "../db.js";
import { Bachs } from "@bachs/sdk";

export const bachs = new Bachs({
  apiKey: process.env.BACHS_KEY,
});

async function subscribe(req, res) {
  const plan = await prisma.plan.findFirst({
    where: { name: req.query.plan },
    select: { name: true, price: true, providerId: true },
  });
  if (!plan) {
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
    return res.redirect("/account/dashboard");
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

async function activate(req, res) {
  req.user.email = "ravesb_b1ee84373f895e80d77b_anichukwuebuka65@gmail.com";
  const subId = await getSubscriptionId(req.user.email);
  if (!subId)
    return res.status(400).json({ message: "You have no active subcription" });
  const response = await fetch(
    `https://api.flutterwave.com/v3/subscriptions/${subId}/activate`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) return res.send("something went wrong");

  const subscription = await prisma.subscription.update({
    where: { userId: req.user.googleId },
    data: { status: "ACTIVE" },
    include: { plan: true },
  });
  return res.json({ subscription });
}

async function createSubscription(event) {
  const {
    data: {
      customer: { email },
      amount,
      subscription_id,
      collection_method,
      current_period_start,
      current_period_end,
      product_id,
    },
  } = event;
  // console.log(event);

  await prisma.user.update({
    where: { uq_email_status: { email, status: "ACTIVE" } },
    data: {
      subscription: {
        update: {
          providerId: subscription_id,
          status: "ACTIVE",
          startDate: current_period_start,
          endDate: current_period_end,
          plan: { connect: { providerId: product_id } },
        },
      },
      ledgerEntries: {
        create: {
          amount: parseInt(amount),
          status: "PAID",
          paymentMethod: collection_method,
          externalTransactionId: subscription_id,
          transactionType: "SUBSCRIPTION_START",
        },
      },
    },
  });
}

async function updateSubscription(req, res) {
  const { transaction_id } = matchedData(req);
  const response = await verify(transaction_id);

  if (!response.ok)
    return res.status(500).json({ error: "unable to verify transaction" });
  const data = await response.json();

  const now = new Date();
  const userEmail = data.customer.email;

  await prisma.subscription.update({
    where: {
      user: { email: userEmail },
    },
    data: {
      status: "ACTIVE",
      startDate: now,
      endDate: addOneMonth(new Date(now)),
    },
  });
  await prisma.ledgerEntries.create({
    data: {
      user: { connect: { email: userEmail } },
      amount: data.amount,
      status: data.status,
      paymentMethod: data.payment_type,
      externalTransactionId: data.id,
      transactionType: "RENEWAL",
    },
  });

  return res.redirect(process.env.FLW_SUCCESS_URL);
}

async function cancelSubscription(req, res) {
  req.user.email = "ravesb_b1ee84373f895e80d77b_anichukwuebuka65@gmail.com";

  const subId = await getSubscriptionId(req.user.email);
  if (!subId)
    return res.status(400).json({ message: "You have no active subcription" });
  const response = await fetch(
    `https://api.flutterwave.com/v3/subscriptions/${subId}/cancel`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) return res.send("something went wrong");

  const subscription = await prisma.subscription.update({
    where: { userId: req.user.googleId },
    data: { status: "CANCELING" },
    include: { plan: true },
  });
  return res.status(200).json({ subscription });
}

async function generatePaymentLink({ name, email }, plan, redirectUrl) {
  const payload = {
    tx_ref: "tx_" + crypto.randomUUID(),
    amount: plan.price,
    currency: "USD",
    redirect_url: `${process.env.APP_URL}/api/${redirectUrl}`,
    payment_plan: plan.providerId,
    interval: "monthly",
    customer: {
      email,
      name,
    },
    meta: { plan: "pro" },
    customizations: {
      title: "Pankas",
      description: "Subscription Activation",
    },
  };

  return await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function addOneMonth(startDate) {
  const year = startDate.getFullYear();
  const month = startDate.getMonth(); // 0-indexed
  const day = startDate.getDate();
  const targetYear = year + Math.floor((month + 1) / 12);
  const targetMonth = (month + 1) % 12;
  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonth + 1,
    0,
  ).getDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  return new Date(targetYear, targetMonth, clampedDay);
}

async function verify(transaction_id) {
  const secretKey = process.env.FLW_SECRET_KEY;
  return await fetch(
    `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );
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

function parseEmail(email) {
  return email.split("_")[2];
}

export default {
  subscribe,
  createSubscription,
  activate,
  updateSubscription,
  cancelSubscription,
};
