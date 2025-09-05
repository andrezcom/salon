import express from 'express';
import { SupplierComparisonController } from '../controllers/supplierComparison';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para comparación de proveedores
router.get('/',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierComparisonController.getComparisons
);

router.get('/:id',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierComparisonController.getComparisonById
);

router.post('/',
  authenticateToken,
  requirePermission('suppliers', 'create'),
  SupplierComparisonController.createComparison
);

router.post('/product/:productId',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierComparisonController.generateProductComparison
);

router.post('/category/:category',
  authenticateToken,
  requirePermission('suppliers', 'read'),
  SupplierComparisonController.generateCategoryComparison
);

export default router;
