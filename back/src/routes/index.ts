import express from 'express';

import authRouter from './auth'
import expertsRouter from './expert'
import userRouter from './user'
import clientRouter from './client'
import productRouter from './product'
import serviceRouter from './service'
import paymentRouter from './payment'
import providerRouter from './provider'

const router = express.Router();
router.use('/auth', authRouter)
router.use('/expert', expertsRouter)
router.use('/user', userRouter)
router.use('/client', clientRouter)
router.use('/product', productRouter)
router.use('/service', serviceRouter)
router.use('/payment', paymentRouter)
router.use('/provider', providerRouter)

export default router