import express from 'express';

import authRouter from './auth'
import expertsRouter from './experts'
import userRouter from './user'

const router = express.Router();
router.use('/auth', authRouter)
router.use('/experts', expertsRouter)
router.use('/user', userRouter)

export default router