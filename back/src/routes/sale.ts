import express from 'express'
import { 
  getSalesCtrl, 
  getSaleByIdCtrl, 
  postSaleCtrl, 
  putSaleCtrl, 
  deleteSaleCtrl,
  getSalesByExpertCtrl 
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

export default router