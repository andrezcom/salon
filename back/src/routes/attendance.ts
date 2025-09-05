import express from 'express';
import { AttendanceController } from '../controllers/attendance';
import { requireAuth, requirePermission } from '../middleware/authorization';

const router = express.Router();

// Rutas para registro de asistencia
router.post('/check-in',
  requireAuth,
  requirePermission('attendance', 'create'),
  AttendanceController.checkIn
);

router.post('/check-out',
  requireAuth,
  requirePermission('attendance', 'create'),
  AttendanceController.checkOut
);

router.post('/break/start',
  requireAuth,
  requirePermission('attendance', 'create'),
  AttendanceController.startBreak
);

router.post('/break/end',
  requireAuth,
  requirePermission('attendance', 'create'),
  AttendanceController.endBreak
);

// Rutas para consulta de asistencia
router.get('/',
  requireAuth,
  requirePermission('attendance', 'read'),
  AttendanceController.getAllAttendance
);

router.get('/employee/:employeeId',
  requireAuth,
  requirePermission('attendance', 'read'),
  AttendanceController.getEmployeeAttendance
);

router.get('/employee/:employeeId/summary',
  requireAuth,
  requirePermission('attendance', 'read'),
  AttendanceController.getAttendanceSummary
);

// Rutas para gestión de asistencia
router.put('/:id',
  requireAuth,
  requirePermission('attendance', 'update'),
  AttendanceController.updateAttendanceRecord
);

router.post('/:id/approve',
  requireAuth,
  requirePermission('attendance', 'approve'),
  AttendanceController.approveAttendanceRecord
);

// Rutas para reglas de asistencia
router.post('/rules',
  requireAuth,
  requirePermission('attendance', 'create'),
  AttendanceController.createAttendanceRule
);

router.get('/rules',
  requireAuth,
  requirePermission('attendance', 'read'),
  AttendanceController.getAttendanceRules
);

export default router;
