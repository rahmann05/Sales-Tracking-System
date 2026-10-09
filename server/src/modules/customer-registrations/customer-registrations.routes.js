import express from 'express';
import { authenticate, authorizeWithPermission } from "../../middlewares/auth.middleware.js";
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './customer-registrations.controller.js';
import * as schema from './customer-registrations.schema.js';
import { ROLES } from '../../utils/constants.js';
import {updateRegistrationLegal} from './services/update-registration-legal.service.js';
import {reviseRegistration} from './services/revise-registration.service.js';

const router = express.Router();

router.use(authenticate);

// 1. Submit new registration (Sales, SPV, Admin)
router.post(
  '/',
  authorizeWithPermission([ROLES.SALES, ROLES.SUPERVISOR, ROLES.ADMIN], 'can_register_outlet'),
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
router.post('/:id/revise',authorizeWithPermission([ROLES.SALES,ROLES.ADMIN,ROLES.SUPERVISOR],'can_register_outlet'),validate(schema.reviseRegistrationSchema),async(req,res,next)=>{try{res.json({status:'success',data:await reviseRegistration(req.params.id,req.body,req.user)});}catch(error){next(error);}});
router.patch('/:id',authorizeWithPermission([ROLES.ADMIN,ROLES.SUPERVISOR],'can_manage_outlets'),async(req,res,next)=>{try{res.json({status:'success',data:await updateRegistrationLegal(req.params.id,req.body,req.user)});}catch(error){next(error);}});

// 4. Approve (Supervisor, Admin)
router.patch(
  '/:id/approve',
  authorizeWithPermission([ROLES.SUPERVISOR, ROLES.ADMIN], 'can_approve_outlet'),
  validate(schema.approveRegistrationSchema),
  controller.approveRegistration
);

// 5. Reject (Supervisor, Admin)
router.patch(
  '/:id/reject',
  authorizeWithPermission([ROLES.SUPERVISOR, ROLES.ADMIN], 'can_approve_outlet'),
  validate(schema.rejectRegistrationSchema),
  controller.rejectRegistration
);

// 6. Finalize & register active outlet (Supervisor, Admin)
router.post(
  '/:id/finalize',
  authorizeWithPermission([ROLES.ADMIN, ROLES.SUPERVISOR], 'can_approve_outlet'),
  validate(schema.finalizeRegistrationSchema),
  controller.finalizeAndRegister
);

export default router;
