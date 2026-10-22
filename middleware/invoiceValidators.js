import { body, param, query, validationResult } from "express-validator";
import pkg from "@prisma/client";

const { SendStatus, InvoiceStatus } = pkg;

/* ------------------------- Shared validate middleware ------------------------ */

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    message: "Validation failed",
    errors: errors.array().map((e) => ({ path: e.path, message: e.msg })),
  });
};

/* ------------------------------- Param rules -------------------------------- */

export const idParam = [
  param("id").isInt({ min: 1 }).withMessage("Invalid id").toInt(),
];

/* ------------------- Nested item rules (inside the invoice body) ------------------- */

const itemRules = [
  body("items.*.description")
    .exists()
    .withMessage("description is required")
    .bail()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("description cannot be empty"),
  body("items.*.quantity")
    .exists()
    .withMessage("quantity is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage("quantity must be a positive integer")
    .toInt(),
  body("items.*.rate")
    .exists()
    .withMessage("rate is required")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("rate must be a non-negative number")
    .toFloat(),
];

/* ------------------------------- Invoice rules ------------------------------ */

const invoiceRules = (required) => {
  const field = (name) =>
    required
      ? body(name).exists().withMessage(`${name} is required`).bail()
      : body(name).optional();

  // Nullable fields: null/undefined skip validation (null is re-applied in the controller)
  const nullable = (name) => body(name).optional({ values: "null" });

  return [
    field("clientId")
      .isInt({ min: 1 })
      .withMessage("clientId must be a positive integer")
      .toInt(),

    field("sendStatus")
      .isIn(Object.values(SendStatus))
      .withMessage(
        `sendStatus must be one of: ${Object.values(SendStatus).join(", ")}`,
      ),

    body("status")
      .optional()
      .isIn(Object.values(InvoiceStatus))
      .withMessage(
        `status must be one of: ${Object.values(InvoiceStatus).join(", ")}`,
      ),

    field("issueDate")
      .isISO8601()
      .withMessage("issueDate must be a valid date")
      .toDate(),

    field("dueDate")
      .isISO8601()
      .withMessage("dueDate must be a valid date")
      .bail()
      .custom((value, { req }) => {
        const issue = req.body.issueDate;
        if (issue && new Date(value) < new Date(issue)) {
          throw new Error("dueDate must be on or after issueDate");
        }
        return true;
      })
      .toDate(),

    nullable("discount")
      .isFloat({ min: 0 })
      .withMessage("discount must be non-negative")
      .toFloat(),
    nullable("tax")
      .isFloat({ min: 0 })
      .withMessage("tax must be non-negative")
      .toFloat(),

    body("currency")
      .optional()
      .isAlpha()
      .isLength({ min: 3, max: 3 })
      .withMessage("currency must be a 3-letter code")
      .toUpperCase(),

    nullable("notes").isString().withMessage("notes must be a string").trim(),
    nullable("terms").isString().withMessage("terms must be a string").trim(),
  ];
};

export const createInvoiceRules = [
  ...invoiceRules(true),
  body("items")
    .isArray({ min: 1 })
    .withMessage("items must be a non-empty array"),
  ...itemRules,
];

export const updateInvoiceRules = [
  body().custom((b) => {
    if (!b || Object.keys(b).length === 0)
      throw new Error("Provide at least one field to update");
    return true;
  }),
  ...invoiceRules(false),
  body("items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("items must be a non-empty array"),
  ...itemRules, // each item sent must be complete
];

/* -------------------------------- List query -------------------------------- */

export const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(Object.values(InvoiceStatus)),
  query("sendStatus").optional().isIn(Object.values(SendStatus)),
  query("clientId").optional().isInt({ min: 1 }).toInt(),
  query("invoiceNumber").optional().isInt({ min: 1 }).toInt(),
  query("from").optional().isISO8601().toDate(), // issueDate >= from
  query("to").optional().isISO8601().toDate(), // issueDate <= to
];
