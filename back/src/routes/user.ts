import express from 'express'
import { getUsersCtrl, userById, postUserCtrl, putUserCtrl, loginUserCtrl } from '../controllers/user';
const { checkToken } = require('../utils/middelwares')
const router = express.Router()

router.get('/', checkToken, getUsersCtrl)
router.get('/:id', userById)
router.post('/', postUserCtrl)
router.post('/login', loginUserCtrl)
router.put('/', putUserCtrl)

export default router