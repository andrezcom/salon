import express from 'express';
import { LoyaltyController } from '../controllers/loyalty';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para programa de fidelidad
router.post('/program',
  authenticateToken,
  requirePermission('loyalty', 'create'),
  LoyaltyController.createLoyaltyProgram
);

router.get('/program',
  authenticateToken,
  requirePermission('loyalty', 'read'),
  LoyaltyController.getLoyaltyProgram
);

router.get('/program/statistics',
  authenticateToken,
  requirePermission('loyalty', 'read'),
  LoyaltyController.getProgramStatistics
);

// Rutas para clientes frecuentes
router.post('/enroll',
  authenticateToken,
  requirePermission('loyalty', 'create'),
  LoyaltyController.enrollCustomer
);

router.get('/customer/:customerId',
  authenticateToken,
  requirePermission('loyalty', 'read'),
  LoyaltyController.getCustomerInfo
);

router.get('/customer/:customerId/history',
  authenticateToken,
  requirePermission('loyalty', 'read'),
  LoyaltyController.getCustomerPointsHistory
);

router.post('/process-points',
  authenticateToken,
  requirePermission('loyalty', 'update'),
  LoyaltyController.processSalePoints
);

router.post('/redeem-points',
  authenticateToken,
  requirePermission('loyalty', 'update'),
  LoyaltyController.redeemPoints
);

router.post('/adjust-points',
  authenticateToken,
  requirePermission('loyalty', 'update'),
  LoyaltyController.adjustPoints
);

// Rutas para reportes y estadísticas
router.get('/top-customers',
  authenticateToken,
  requirePermission('loyalty', 'read'),
  LoyaltyController.getTopCustomers
);

router.get('/customers/level/:level',
  authenticateToken,
  requirePermission('loyalty', 'read'),
  LoyaltyController.getCustomersByLevel
);

export default router;
