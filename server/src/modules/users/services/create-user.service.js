/** createUser - single-responsibility service (extracted from users.service.js). */
import bcrypt from 'bcryptjs';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { USER_SELECT, enrichUserResponse } from './users.helpers.js';


export const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const created = await prisma.user.create({
    data: { ...data, password: hashedPassword },
    select: USER_SELECT,
  });
  return enrichUserResponse(created);
};
