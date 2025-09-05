import express from 'express'
import { 
  getSalesCtrl, 
  getSaleByIdCtrl, 
  postSaleCtrl, 
  putSaleCtrl, 
  deleteSaleCtrl,
  getSalesByExpertCtrl,
  applyDiscountCtrl,
  getDiscountSummaryCtrl,
  calculateSaleImpactCtrl
} from '../controllers/sale'
import { requireAuth, requirePermission } from '../middleware/authorization'

const router = express.Router()

// Rutas con autenticación y permisos
router.get('/', 
  requireAuth,
  requirePermission('sales', 'read'),
  getSalesCtrl
)

router.get('/:id', 
  requireAuth,
  requirePermission('sales', 'read'),
  getSaleByIdCtrl
)

router.post('/', 
  requireAuth,
  requirePermission('sales', 'create'),
  postSaleCtrl
)

router.put('/:id', 
  requireAuth,
  requirePermission('sales', 'update'),
  putSaleCtrl
)

router.delete('/:id', 
  requireAuth,
  requirePermission('sales', 'delete'),
  deleteSaleCtrl
)

// Ruta para obtener ventas por experto
router.get('/expert/:expertId', 
  requireAuth,
  requirePermission('sales', 'read'),
  getSalesByExpertCtrl
)

// Rutas para manejo de descuentos
router.post('/:id/discounts', 
  requireAuth,
  requirePermission('sales', 'update'),
  applyDiscountCtrl
)

router.get('/:id/discounts/summary', 
  requireAuth,
  requirePermission('sales', 'read'),
  getDiscountSummaryCtrl
)

// Ruta para calcular impacto de venta en inventario
router.post('/calculate-impact', 
  requireAuth,
  requirePermission('sales', 'read'),
  calculateSaleImpactCtrl
)

export default router