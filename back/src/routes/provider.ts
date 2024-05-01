import express from 'express'
import { getProvidersCtrl, providerById, postProviderCtrl, putProviderCtrl } from '../controllers/provider'
const router = express.Router()

router.get('/', getProvidersCtrl)
router.get('/:id', providerById)
router.post('/', postProviderCtrl)
router.put('/', putProviderCtrl)

export default router