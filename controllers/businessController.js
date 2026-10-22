import { matchedData } from "express-validator";
import { prisma } from "../db.js";
import { ImgBB } from "../utils/imgbb.js";
import { includes } from "zod";

const imgbb = new ImgBB();

const createOrUpdate = async (req, res) => {
  const {
    info: { name, email, phone, address },
  } = matchedData(req);

  const img = await imgbb.upload(req.file.buffer, {
    name: req.file.originalname,
  });

  const options = {
    name,
    email,
    phone,
    address,
    logo: {
      create: { providerId: img.id, url: img.url, deleteUrl: img.deleteUrl },
    },
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
    includes: { logo: true },
  });
  res.status(201).json(business);
};

const find = async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    includes: { logo: { select: { url: true } } },
  });
  if (business?.logo) {
    business.logo = business.logo;
  }
  res.json(business);
};

export default { find, createOrUpdate };
