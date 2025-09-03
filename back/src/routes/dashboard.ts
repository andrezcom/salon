import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard';

const router = Router();

// Dashboard principal de comisiones
router.get('/business/:businessId/commissions/dashboard', DashboardController.getCommissionDashboard);

// Dashboard específico de un experto
router.get('/business/:businessId/experts/:expertId/dashboard', DashboardController.getExpertDashboard);

// Alertas y notificaciones del dashboard
router.get('/business/:businessId/commissions/alerts', DashboardController.getDashboardAlerts);

export default router;
