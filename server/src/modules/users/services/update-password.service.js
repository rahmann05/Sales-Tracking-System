/** updatePassword - single-responsibility service for admin to reset user passwords. */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import bcrypt from 'bcryptjs';

export const updatePassword = async (id, newPassword) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new AppError('User tidak ditemukan', 404);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
};
