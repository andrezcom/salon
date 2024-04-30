import express from 'express'
import { getUsersCtrl, userById, postUserCtrl, putUserCtrl } from '../controllers/user'
const router = express.Router()

router.get('/', getUsersCtrl)
router.get('/:id', userById)
router.post('/', postUserCtrl)
router.put('/', putUserCtrl)

export default router