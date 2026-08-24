import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/users.routes.js';
import clusterRoutes from '../modules/clusters/clusters.routes.js';
import outletRoutes from '../modules/outlets/outlets.routes.js';
import productRoutes from '../modules/products/products.routes.js';
import pjpRoutes from '../modules/pjp/pjp.routes.js';
import absensiRoutes from '../modules/absensi/absensi.routes.js';
import orderRoutes from '../modules/orders/orders.routes.js';
import routeChangeRoutes from '../modules/route-changes/route-change.routes.js';
import notificationRoutes from '../modules/notifications/notifications.routes.js';
import reportRoutes from '../modules/reports/reports.routes.js';
import routingRoutes from '../modules/routing/routing.routes.js';
import vehicleRoutes from '../modules/vehicles/vehicles.routes.js';
import configRoutes from '../modules/config/config.routes.js';
import customerRegistrationRoutes from '../modules/customer-registrations/customer-registrations.routes.js';

const router = Router();

router.use('/health', healthRoutes);

const v1Router = Router();
v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/clusters', clusterRoutes);
v1Router.use('/outlets', outletRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/pjp', pjpRoutes);
v1Router.use('/absensi', absensiRoutes);
v1Router.use('/orders', orderRoutes);
v1Router.use('/route-changes', routeChangeRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/reports', reportRoutes);
v1Router.use('/routing', routingRoutes);
v1Router.use('/vehicles', vehicleRoutes);
v1Router.use('/config', configRoutes);
v1Router.use('/customer-registrations', customerRegistrationRoutes);

router.use('/v1', v1Router);

export default router;
