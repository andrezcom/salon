import express from 'express'
import { getClientsCtrl, clientById, postClientCtrl, putClientCtrl } from '../controllers/client'
const router = express.Router()

router.get('/', getClientsCtrl)
router.get('/:id', clientById)
router.post('/', postClientCtrl)
router.put('/', putClientCtrl)

export default router