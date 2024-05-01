import express from 'express'
import { getPaymentsCtrl, paymentById, postPaymentCtrl, putPaymentCtrl } from '../controllers/payment'
const router = express.Router()

router.get('/', getPaymentsCtrl)
router.get('/:id', paymentById)
router.post('/', postPaymentCtrl)
router.put('/', putPaymentCtrl)

export default router