import express from 'express'
import { getSalesCtrl, saleById, postSaleCtrl, putSaleCtrl } from '../controllers/sale'
const router = express.Router()

router.get('/', getSalesCtrl)
router.get('/:id', saleById)
router.post('/', postSaleCtrl)
router.put('/', putSaleCtrl)

export default router