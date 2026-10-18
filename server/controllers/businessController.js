import { matchedData } from "express-validator";
import { prisma } from "../db.js";

const createOrUpdate = async (req, res) => {
  const {
    info: { name, email, phone, address },
  } = matchedData(req);
  const options = {
    name,
    email,
    phone,
    address,
    logo: req?.file?.path,
    user: {
      connect: {
        id: req.user.id,
      },
    },
  };

  const business = await prisma.business.upsert({
    where: { userId: req.user.id },
    create: options,
    update: options,
  });
  res.status(201).json(business);
};

const find = async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
  });
  if (business?.logo) {
    business.logo = process.env.APP_URL + "/" + business.logo;
  }
  res.json(business);
};

export default { find, createOrUpdate };
