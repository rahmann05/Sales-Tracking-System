import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../notifications/notifications.service.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../utils/pagination.js';
import { ORDER_STATUS, ROLES, NOTIFICATION_TYPES } from '../../utils/constants.js';

export const createOrder = async (salesId, pjpStopId, items) => {
  const stop = await prisma.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: { pjp: true, attendances: true, outlet: true },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);

  if (stop.pjp.userId !== salesId) {
    throw new AppError('Anda hanya dapat menginput order pada outlet PJP milik Anda sendiri', 403);
  }

  const hasActiveCheckIn = stop.attendances.some((a) => a.userId === salesId && a.type === 'IN');
  if (!hasActiveCheckIn) {
    throw new AppError('Input order hanya valid jika Anda sudah melakukan Absen IN pada outlet ini', 400);
  }

  // Build order items and calculate total
  let totalValue = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.deletedAt) {
      throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, 404);
    }

    const unitPrice = item.unitPrice ?? product.price;
    const subtotal = unitPrice * item.quantity;
    totalValue += subtotal;

    orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal });
  }

  const order = await prisma.order.create({
    data: {
      pjpStopId,
      createdBy: salesId,
      totalValue,
      status: ORDER_STATUS.PENDING_APPROVAL,
      items: { create: orderItemsData },
    },
    include: {
      items: { include: { product: true } },
      pjpStop: { include: { outlet: true } },
      createdByUser: { select: { id: true, name: true } },
    },
  });

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR, ROLES.ADMIN],
    NOTIFICATION_TYPES.ORDER_CREATED,
    'Order Baru Perlu Persetujuan',
    `Sales ${order.createdByUser.name} menginput order Rp ${totalValue.toLocaleString('id-ID')} di outlet ${stop.outlet.name}`,
    { orderId: order.id }
  );

  return order;
};

export const getOrders = async (currentUser, query = {}) => {
  const { status, salesId, date } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if (status) where.status = status;
  if (salesId) where.createdBy = salesId;
  if (date) where.createdAt = buildDayRange(date);

  // Sales can only see their own orders
  if (currentUser.role === ROLES.SALES) {
    where.createdBy = currentUser.id;
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        approvedByUser: { select: { id: true, name: true } },
        pjpStop: { include: { outlet: { select: { id: true, name: true, address: true } } } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};

export const getOrderById = async (id, currentUser) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      approvedByUser: { select: { id: true, name: true } },
      pjpStop: { include: { outlet: true, pjp: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);

  const isOwner = order.createdBy === currentUser.id;
  const isPrivileged = [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.MANAJER_OPERASIONAL].includes(currentUser.role);
  if (!isOwner && !isPrivileged) throw new AppError('Anda tidak memiliki akses ke order ini', 403);

  return order;
};

export const approveOrder = async (orderId, adminId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);
  if (order.status !== ORDER_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Order sudah diproses sebelumnya (Status: ${order.status})`, 409);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: ORDER_STATUS.APPROVED, approvedBy: adminId, approvedAt: new Date() },
    include: { items: { include: { product: true } } },
  });

  await createNotification(
    order.createdBy,
    NOTIFICATION_TYPES.ORDER_APPROVED,
    'Order Disetujui',
    `Order Anda di outlet "${order.pjpStop.outlet.name}" telah disetujui`,
    { orderId: order.id }
  );

  return updatedOrder;
};

export const rejectOrder = async (orderId, adminId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);
  if (order.status !== ORDER_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Order sudah diproses sebelumnya (Status: ${order.status})`, 409);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: ORDER_STATUS.REJECTED, approvedBy: adminId, approvedAt: new Date() },
  });

  await createNotification(
    order.createdBy,
    NOTIFICATION_TYPES.ORDER_REJECTED,
    'Order Ditolak',
    `Order Anda di outlet "${order.pjpStop.outlet.name}" ditolak`,
    { orderId: order.id }
  );

  return updatedOrder;
};
