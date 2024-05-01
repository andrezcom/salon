import express from 'express'
import { getServicesCtrl, serviceById, postServiceCtrl, putServiceCtrl } from '../controllers/service'
const router = express.Router()

router.get('/', getServicesCtrl)
router.get('/:id', serviceById)
router.post('/', postServiceCtrl)
router.put('/', putServiceCtrl)

export default router