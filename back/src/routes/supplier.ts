import express from 'express';
import { SupplierController } from '../controllers/supplier';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para gestión de proveedores
router.get('/',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierController.getSuppliers
);

router.get('/:id',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierController.getSupplierById
);

router.get('/:id/products',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierController.getSupplierProducts
);

router.get('/:id/summary',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierController.getSupplierSummary
);

router.post('/',
  authenticateToken,
  requirePermission('suppliers', 'create'),
  SupplierController.createSupplier
);

router.put('/:id',
  authenticateToken,
  requirePermission('suppliers', 'update'),
  SupplierController.updateSupplier
);

router.delete('/:id',
  authenticateToken,
  requirePermission('suppliers', 'delete'),
  SupplierController.deleteSupplier
);

router.put('/:id/rating',
  authenticateToken,
  requirePermission('suppliers', 'update'),
  SupplierController.updateSupplierRating
);

router.put('/:id/suspend',
  authenticateToken,
  requirePermission('suppliers', 'update'),
  SupplierController.suspendSupplier
);

router.put('/:id/activate',
  authenticateToken,
  requirePermission('suppliers', 'update'),
  SupplierController.activateSupplier
);

export default router;
