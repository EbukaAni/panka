import { matchedData } from "express-validator";
import pkg, { InvoiceStatus } from "@prisma/client";
import { prisma } from "../db.js";

const { Prisma } = pkg;

const D = Prisma.Decimal;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const NULLABLE = ["discount", "tax", "notes", "terms"];
const applyNulls = (data, body) => {
  for (const key of NULLABLE) if (body[key] === null) data[key] = null;
  return data;
};

const assertClientOwned = async (clientId, userId) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) throw new HttpError(404, "Client not found");
};

const assertInvoiceOwned = async (id, userId) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");
};

const fullInclude = { items: true, client: true };

/* ------------------------------ Controllers ----------------------------- */

export const createInvoice = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { items, ...data } = matchedData(req, { locations: ["body"] });
  applyNulls(data, req.body);

  await assertClientOwned(data.clientId, userId);

  const invoice = await prisma.$transaction(async (tx) => {
    const { _max } = await tx.invoice.aggregate({
      where: { userId },
      _max: { invoiceNumber: true },
    });

    return tx.invoice.create({
      data: {
        ...data,
        userId,
        invoiceNumber: (_max.invoiceNumber ?? 0) + 1,
        items: { create: items },
        total: calculateTotal(items, Number(data.tax), Number(data.discount)),
      },
      include: fullInclude,
    });
  });

  res.status(201).json(invoice);
});

function calculateTotal(items, tax = 0, discount = 0) {
  const total = items.reduce((sum, item) => {
    return sum + Number(item.rate) * Number(item.quantity);
  }, 0);

  const taxAmt = (total * tax) / 100;

  return total + taxAmt - discount;
}

export const getInvoices = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const q = matchedData(req, { locations: ["query"] });
  const page = q.page ?? 1;
  const limit = q.limit ?? 20;

  const where = {
    userId,
    ...(q.status && { status: q.status }),
    ...(q.sendStatus && { sendStatus: q.sendStatus }),
    ...(q.clientId && { clientId: q.clientId }),
    ...(q.invoiceNumber && { invoiceNumber: q.invoiceNumber }),
    ...((q.from || q.to) && {
      issueDate: { ...(q.from && { gte: q.from }), ...(q.to && { lte: q.to }) },
    }),
  };

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: fullInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    data: invoices.map(withTotals),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const { id } = matchedData(req, { locations: ["params"] });

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: req.user.id },
    include: fullInclude,
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");

  res.json(withTotals(invoice));
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = matchedData(req, { locations: ["params"] });
  const { items, ...data } = matchedData(req, { locations: ["body"] });
  applyNulls(data, req.body);

  await assertInvoiceOwned(id, userId);
  if (data.clientId) await assertClientOwned(data.clientId, userId);

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...data,
      ...(items && { items: { deleteMany: {}, create: items } }),
    },
    include: fullInclude,
  });

  res.json(withTotals(invoice));
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = matchedData(req, { locations: ["params"] });

  const { count } = await prisma.invoice.deleteMany({
    where: { id, userId: req.user.id },
  });
  if (!count) throw new HttpError(404, "Invoice not found");

  res.status(204).send();
});

export const getStats = async (req, res) => {
  const now = new Date();
  const userId = req.user.id;

  const [paid, unpaid, overdue, totalInvoice, totalRevenue] =
    await prisma.$transaction([
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.PAID },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.UNPAID, dueDate: { gte: now } },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.UNPAID, dueDate: { lt: now } },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { userId },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.PAID },
        _sum: { total: true },
      }),
    ]);

  const stats = {
    paid: paid._count.id ?? 0,
    unpaid: unpaid._count.id ?? 0,
    overdue: overdue._count.id ?? 0,
    total: totalInvoice._count.id ?? 0,
    revenue: totalRevenue._sum.total ?? 0,
  };
  res.json(stats);
};

export const markAPaid = async (req, res) => {
  const result = await prisma.invoice.update({
    where: { userId: req.user.id, id: Number(req.params.id) },
    data: { status: InvoiceStatus.PAID },
  });
  if (result) {
    res.send(204).end();
  }
};

export const invoiceErrorHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof HttpError)
    return res.status(err.status).json({ message: err.message });

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025")
      return res.status(404).json({ message: "Record not found" });
    if (err.code === "P2002")
      return res.status(409).json({ message: "Duplicate record" });
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
