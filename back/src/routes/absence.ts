import express from 'express';
import { AbsenceController } from '../controllers/absence';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para solicitudes de ausencia
router.post('/request',
  requireAuth,
  requirePermission('absence', 'create'),
  AbsenceController.createAbsenceRequest
);

router.get('/requests',
  requireAuth,
  requirePermission('absence', 'read'),
  AbsenceController.getAbsenceRequests
);

router.get('/requests/pending',
  requireAuth,
  requirePermission('absence', 'approve'),
  AbsenceController.getPendingRequests
);

router.post('/request/:id/approve',
  requireAuth,
  requirePermission('absence', 'approve'),
  AbsenceController.approveAbsenceRequest
);

router.post('/request/:id/reject',
  requireAuth,
  requirePermission('absence', 'approve'),
  AbsenceController.rejectAbsenceRequest
);

router.post('/request/:id/cancel',
  requireAuth,
  requirePermission('absence', 'update'),
  AbsenceController.cancelAbsenceRequest
);

// Rutas para balance de ausencias
router.get('/employee/:employeeId/balance',
  requireAuth,
  requirePermission('absence', 'read'),
  AbsenceController.getEmployeeBalance
);

router.get('/employee/:employeeId/requests',
  requireAuth,
  requirePermission('absence', 'read'),
  AbsenceController.getEmployeeRequests
);

router.put('/employee/:employeeId/balance',
  requireAuth,
  requirePermission('absence', 'update'),
  AbsenceController.updateAbsenceBalance
);

// Rutas para políticas de ausencias
router.post('/policy',
  requireAuth,
  requirePermission('absence', 'create'),
  AbsenceController.createAbsencePolicy
);

router.get('/policies',
  requireAuth,
  requirePermission('absence', 'read'),
  AbsenceController.getAbsencePolicies
);

export default router;
