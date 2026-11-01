import { matchedData } from "express-validator";
import { prisma } from "../db.js";
import { put, del } from "@vercel/blob";

const create = async (req, res) => {
  const {
    info: { name, email, phone, address },
  } = matchedData(req);

  const newLogo = Boolean(req.file?.buffer);
  let img;

  if (newLogo) {
    img = await put(req.file.originalname, req.file.buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  }

  const options = {
    name,
    email,
    phone,
    address,
    ...(img && {
      logo: {
        create: { url: img.url },
      },
    }),
    user: {
      connect: {
        id: req.user.id,
      },
    },
  };

  const business = await prisma.business.create({
    data: options,
    ...(img && { include: { logo: true } }),
  });
  res.status(201).json(business);
};

const update = async (req, res) => {
  const {
    info: { name, email, phone, address },
  } = matchedData(req);

  const newLogo = Boolean(req.file?.buffer);
  let img;

  if (newLogo) {
    const oldLogo = await prisma.business.findFirst({
      where: { id: Number(req.params.id) },
      select: { logo: true },
    });
    if (oldLogo) await del(oldLogo.logo.url);

    img = await put(req.file.originalname, req.file.buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  }

  const options = {
    name,
    email,
    phone,
    address,
    ...(img && {
      logo: {
        update: { url: img.url },
      },
    }),
  };

  const business = await prisma.business.update({
    where: { userId: req.user.id },
    data: options,
    ...(img && { include: { logo: true } }),
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

export default { find, create, update };
