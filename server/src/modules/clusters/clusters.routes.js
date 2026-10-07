import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {importRjp} from './services/import-rjp.service.js';
import { Router } from 'express';
import * as clusterController from './clusters.controller.js';
import { authenticate, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { memoryCacheMiddleware } from "../../middlewares/cache.middleware.js";
import { 
  createClusterSchema, 
  updateClusterSchema,
  getNearestOutletsSchema,
  generateRoutesSchema,
  createFullClusterSchema,
  updateOutletsSchema,
  updateRoutesSchema,
  setActiveRouteSchema
} from './clusters.schema.js';

const router = Router();

router.use(authenticate);
router.param('id',async(req,res,next,id)=>{
  try{
    if(req.user.role==='ADMIN')return next();
    const cluster=await prisma.cluster.findFirst({where:{id,deletedAt:null,...(req.user.role==='SUPERVISOR'?{supervisorId:req.user.id}:{OR:[{assignedSalesId:req.user.id},{users:{some:{id:req.user.id}}}]})},select:{id:true}});
    if(!cluster)throw new AppError('Klaster berada di luar penugasan Anda',403);next();
  }catch(e){next(e);}
});

// Existing CRUD with in-memory caching
router.get('/', memoryCacheMiddleware(60), clusterController.getAll);
router.post('/import-rjp',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_rjp'),async(req,res,next)=>{try{res.json({success:true,data:await importRjp(req.body.rows,req.user)});}catch(e){next(e);}});
router.get('/:id', memoryCacheMiddleware(60), clusterController.getById);
router.post('/', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(createClusterSchema), clusterController.create);
router.patch('/:id', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(updateClusterSchema), clusterController.update);
router.delete('/:id', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), clusterController.remove);

// New Create Cluster Flow
router.post('/nearest-outlets', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(getNearestOutletsSchema), clusterController.getNearestOutlets);
router.post('/generate-routes', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(generateRoutesSchema), clusterController.generateRoutes);
router.post('/full', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(createFullClusterSchema), clusterController.createFull);

// Manual Edit
router.patch('/:id/outlets', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(updateOutletsSchema), clusterController.updateOutlets);
router.patch('/:id/routes', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(updateRoutesSchema), clusterController.updateRoutes);
router.patch('/:id/routes/:routeIndex/activate', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_clusters'), validate(setActiveRouteSchema), clusterController.setActiveRoute);

export default router;
