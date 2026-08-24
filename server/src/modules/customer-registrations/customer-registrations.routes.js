import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './customer-registrations.controller.js';
import * as schema from './customer-registrations.schema.js';
import { ROLES } from '../../utils/constants.js';

const router = express.Router();

router.use(authenticate);

// 1. Submit new registration (Sales, SPV, Ops, Admin)
router.post(
  '/',
  authorize(ROLES.SALES, ROLES.SUPERVISOR, ROLES.MANAJER_OPERASIONAL, ROLES.ADMIN),
  validate(schema.createRegistrationSchema),
  controller.createRegistration
);

// Search places via Google Places
router.get('/search-places', controller.searchPlaces);

// Reverse geocode lat/lng to subArea/kelurahan/area
router.get('/reverse-geocode', controller.reverseGeocode);

// 2. Get paginated registrations with filters
router.get(
  '/',
  validate(schema.filterRegistrationSchema, 'query'),
  controller.getRegistrations
);

// 3. Get single registration by ID
router.get('/:id', controller.getRegistrationById);

// 4. Approve (Supervisor, Ops Manager, Admin)
router.patch(
  '/:id/approve',
  authorize(ROLES.SUPERVISOR, ROLES.MANAJER_OPERASIONAL, ROLES.ADMIN),
  validate(schema.approveRegistrationSchema),
  controller.approveRegistration
);

// 5. Reject (Supervisor, Ops Manager, Admin)
router.patch(
  '/:id/reject',
  authorize(ROLES.SUPERVISOR, ROLES.MANAJER_OPERASIONAL, ROLES.ADMIN),
  validate(schema.rejectRegistrationSchema),
  controller.rejectRegistration
);

// 6. Finalize & register active outlet (Admin, Ops Manager)
router.post(
  '/:id/finalize',
  authorize(ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL),
  validate(schema.finalizeRegistrationSchema),
  controller.finalizeAndRegister
);

export default router;
