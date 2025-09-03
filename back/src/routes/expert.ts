import express from 'express'
import { 
  getExpertsCtrl, 
  expertById, 
  postExpertCtrl, 
  putExpertCtrl,
  getExpertCommissionSettings,
  updateExpertCommissionSettings,
  toggleExpertStatus
} from '../controllers/expert'

const router = express.Router()

// Rutas básicas de expertos
router.get('/', getExpertsCtrl)
router.get('/:expertId', expertById)
router.post('/', postExpertCtrl)
router.put('/:expertId', putExpertCtrl)

// Rutas específicas de comisiones
router.get('/:expertId/commission-settings', getExpertCommissionSettings)
router.put('/:expertId/commission-settings', updateExpertCommissionSettings)

// Gestión de estado
router.put('/:expertId/status', toggleExpertStatus)

export default router