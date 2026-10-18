import { body } from "express-validator";
import { prisma } from "../db.js";
import { validate } from "./validate.js";

export const idempotency = async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];

  if (!idempotencyKey) {
    return res
      .status(400)
      .json({ error: "Idempotency-Key header is required" });
  }

  const existingRequest = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingRequest) {
    // Return the exact same response as before, bypassing creation
    return res.status(200).json(existingRequest.response);
  }

  next();
};

export const validateFields = [
  body([
    "currency",
    "tax",
    "discount",
    "startDate",
    "frequency",
    "items.*.description",
    "item.*.rate",
    "item.*.amount",
    "item.*.quantity",
  ]).notEmpty(),
  body("currency").isLength(3),
  body("status")
    .isIn(["ACTIVE", "PAUSED"])
    .withMessage("role must be one of: active,paused"),
  body(["item.*.rate", "item.*.quantity"]).isNumeric(),
  body("saveToDrive").notEmpty().isBoolean(),
  body("dueDateInterval").notEmpty().isNumeric(),
  body(["terms", "notes"]).optional({ values: "falsy" }).notEmpty(),
  body("items")
    .isArray({ min: 1 })
    .withMessage("recurring invoice must have at least one item"),
  body("clientId")
    .notEmpty()
    .isInt()
    .custom(async (value) => {
      const client = await prisma.client.findUnique({
        where: {
          id: parseInt(value),
        },
      });
      if (!client) throw new Error("No contacts with this id");
    }),
  validate,
];

export const validateUpdateFields = [
  body([
    "currency",
    "tax",
    "discount",
    "startDate",
    "frequency",
    "items.*.description",
    "item.*.rate",
    "item.*.quantity",
  ])
    .optional({ values: "falsy" })
    .notEmpty(),
  body("id").isNumeric(),
  body(["item.*.rate", "item.*.quantity"]).isNumeric(),
  body("status")
    .isIn(["ACTIVE", "PAUSED"])
    .withMessage("status must be one of: active,paused"),
  body("currency").optional({ values: "falsy" }).isLength(3),
  body("saveToDrive").optional({ values: "falsy" }).isBoolean(),
  body("dueDateInterval").optional({ values: "falsy" }).isNumeric(),
  body(["terms", "notes"]).optional({ values: "falsy" }).notEmpty(),
  body("items")
    .optional({ values: "falsy" })
    .isArray({ min: 1 })
    .withMessage("recurring invoice must have at least one item"),
  body("clientId")
    .notEmpty()
    .isInt()
    .custom(async (value) => {
      const client = await prisma.client.findUnique({
        where: {
          id: parseInt(value),
        },
      });
      if (!client) throw new Error("No contacts with this id");
    }),
  validate,
];

export const hasBusinessInfo = async (req, res, next) => {
  const business = await prisma.business.findUnique({
    where: {
      userId: req.user.id,
    },
  });
  if (!business)
    return res.status(422).json({ message: "No business details saved" });
  next();
};

export const hasOauthAccess = async (req, res, next) => {
  const token = await prisma.mailSendToken.findUnique({
    where: { userId: req.user.id },
  });
  if (!token)
    return res.status(422).json({
      message: "can not create recurring invoice.No user access token",
    });
  next();
};
