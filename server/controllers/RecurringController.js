import { matchedData } from "express-validator";
import { prisma } from "../db.js";

const create = async (req, res) => {
  const {
    clientId,
    dueDateInterval,
    notes,
    currency,
    tax,
    discount,
    terms,
    startDate,
    items,
    frequency,
    status,
    saveToDrive,
  } = matchedData(req);
  const idempotencyKey = req.headers["idempotency-key"];

  const createOption = {
    include: { client: true },
    data: {
      user: {
        connect: { id: req.user.id },
      },
      client: {
        connect: {
          id: parseInt(clientId),
        },
      },
      status: status.toUpperCase(),
      frequency,
      saveToDrive,
      startDate: new Date(startDate),
      dueDateInterval,
      nextIssueDate: new Date(startDate),
      currency,
      items: {
        create: items.map((item) => ({
          description: item.description,
          rate: parseFloat(item.rate),
          quantity: parseInt(item.quantity),
        })),
      },
      tax,
      discount,
      notes,
      terms,
    },
  };

  const recurring = await prisma.recurringInvoice.create(createOption);
  await prisma.idempotencyKey.create({
    data: {
      key: idempotencyKey,
      response: recurring,
    },
  });
  res.status(201).json(recurring);
};

const update = async (req, res) => {
  const data = matchedData(req);

  delete data.clientId;

  if (data.items) {
    data.items.update = data.items;
    delete data.items;
  }
  if (data.startDate) {
    data.nextIssueDate = data.startDate;
  }
  const recurring = await prisma.recurringInvoice.update({
    where: { id: parseInt(data.id) },
    include: { client: true },
    data,
  });

  res.status(201).json(recurring);
};

const index = async (req, res) => {
  const recurring = await prisma.recurringInvoice.findMany({
    where: { userId: req.user.id },
    include: { client: true, items: true },
  });
  const modified = recurring.map((r) => {
    r.discount = Number(r.discount);
    r.tax = Number(r.tax);
    r.items = r.items.map((item) => {
      item.rate = Number(item.rate);
      return item;
    });
    return r;
  });
  return res.json(recurring);
};

const find = async (req, res) => {
  const result = await prisma.recurringInvoice.findFirst({
    where: { id: req.params.id },
  });
  res.status(200).json(result);
};

const remove = async (req, res) => {
  await prisma.recurringInvoice.delete({
    where: { id: Number(req.params.id) },
  });

  res.status(204).end();
};

const pause = async (req, res) => {
  const result = await prisma.recurringInvoice.update({
    where: { id: Number(req.params.id) },
    data: { status: "DISABLED" },
    select: { id: true, status: true },
  });
  if (result) res.status(201).json(result);
};

const resume = async (req, res) => {
  const result = await prisma.recurringInvoice.update({
    where: { id: Number(req.params.id) },
    data: { status: "ACTIVE" },
    select: { id: true, status: true },
  });
  if (result) res.status(201).json(result);
};

export default {
  create,
  update,
  index,
  find,
  pause,
  resume,
  remove,
};
