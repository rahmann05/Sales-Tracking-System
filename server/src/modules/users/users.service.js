import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

/** Reusable select object that includes all user fields */
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  clusterId: true,
  cluster: { select: { id: true, name: true, region: true } },
  createdAt: true,
};

export const getUsers = async (query = {}) => {
  const { role, clusterId, search } = query;
  const where = { deletedAt: null };

  if (role) where.role = role;
  if (clusterId) where.clusterId = clusterId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(enrichUserResponse);
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user || user.deletedAt) {
    throw new AppError('User tidak ditemukan', 404);
  }
  return enrichUserResponse(user);
};

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

export const updateUser = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
  return enrichUserResponse(updated);
};

export const deleteUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

const ROLE_LABELS = {
  SALES: 'Sales Field Rep',
  SUPERVISOR: 'Supervisor Operasional',
  ADMIN: 'Admin Penjualan',
  MANAJER_OPERASIONAL: 'Manajer Operasional',
};

const enrichUserResponse = (user) => ({
  ...user,
  region: user.cluster?.region ?? null,
  clusterName: user.cluster?.name ?? null,
  roleLabel: ROLE_LABELS[user.role] ?? user.role,
});
