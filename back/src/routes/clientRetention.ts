import express from 'express';
import { ClientRetentionController } from '../controllers/clientRetention';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Rutas para gestión de retención de clientes
router.post('/create',
  authenticateToken,
  requirePermission('clientRetention', 'create'),
  ClientRetentionController.createClientRetention
);

router.post('/record-visit',
  authenticateToken,
  requirePermission('clientRetention', 'update'),
  ClientRetentionController.recordClientVisit
);

router.post('/analyze-inactive',
  authenticateToken,
  requirePermission('clientRetention', 'update'),
  ClientRetentionController.analyzeInactiveClients
);

// Rutas para consultas y reportes
router.get('/at-risk',
  authenticateToken,
  requirePermission('clientRetention', 'read'),
  ClientRetentionController.getAtRiskCustomers
);

router.get('/critical',
  authenticateToken,
  requirePermission('clientRetention', 'read'),
  ClientRetentionController.getCriticalCustomers
);

router.get('/needing-follow-up',
  authenticateToken,
  requirePermission('clientRetention', 'read'),
  ClientRetentionController.getClientsNeedingFollowUp
);

router.get('/statistics',
  authenticateToken,
  requirePermission('clientRetention', 'read'),
  ClientRetentionController.getRetentionStatistics
);

router.get('/dashboard',
  authenticateToken,
  requirePermission('clientRetention', 'read'),
  ClientRetentionController.getRetentionDashboard
);

router.get('/client/:customerId/history',
  authenticateToken,
  requirePermission('clientRetention', 'read'),
  ClientRetentionController.getClientHistory
);

// Rutas para campañas de recuperación
router.post('/recovery-campaign',
  authenticateToken,
  requirePermission('clientRetention', 'create'),
  ClientRetentionController.createRecoveryCampaign
);

router.post('/campaign-response',
  authenticateToken,
  requirePermission('clientRetention', 'update'),
  ClientRetentionController.recordCampaignResponse
);

router.post('/mark-recovered',
  authenticateToken,
  requirePermission('clientRetention', 'update'),
  ClientRetentionController.markClientAsRecovered
);

// Rutas para notas y seguimiento
router.post('/add-note',
  authenticateToken,
  requirePermission('clientRetention', 'create'),
  ClientRetentionController.addClientNote
);

export default router;
