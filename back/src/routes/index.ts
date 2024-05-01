import express from 'express';

import authRouter from './auth'
import expertsRouter from './expert'
import userRouter from './user'
import clientRouter from './client'

const router = express.Router();
router.use('/auth', authRouter)
router.use('/expert', expertsRouter)
router.use('/user', userRouter)
router.use('/client', clientRouter)

export default router