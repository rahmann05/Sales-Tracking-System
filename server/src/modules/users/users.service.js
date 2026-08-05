import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

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

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clusterId: true,
      cluster: { select: { id: true, name: true, region: true } },
      salesId: true,
      sales: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clusterId: true,
      cluster: { select: { id: true, name: true, region: true } },
      salesId: true,
      sales: { select: { id: true, name: true } },
      subordinates: { select: { id: true, name: true, role: true } },
      createdAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError('User tidak ditemukan', 404);
  }
  return user;
};

export const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clusterId: true,
      salesId: true,
      createdAt: true,
    },
  });
};

export const updateUser = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clusterId: true,
      salesId: true,
      updatedAt: true,
    },
  });
};

export const deleteUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
