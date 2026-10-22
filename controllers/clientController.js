import { matchedData } from "express-validator";
import { prisma } from "../db.js";

const createOrUpdate = async (req, res) => {
  const data = matchedData(req);
  const option = {
    ...data,
    user: { connect: { id: req.user.id } },
  };

  const client = await prisma.client.upsert({
    where: {
      uq_userid_email: {
        userId: req.user.id,
        email: data?.email || " ",
      },
    },
    create: (function () {
      delete option.id;
      return option;
    })(),
    update: option,
  });
  res.status(201).json(client);
};

const remove = async (req, res) => {
  const result = await prisma.client.delete({
    where: { id: parseInt(req.params.clientId) },
  });
  if (result) res.status(204).end();
};

export default { createOrUpdate, remove };
