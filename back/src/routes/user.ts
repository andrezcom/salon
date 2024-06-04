import express from 'express'
import { getUsersCtrl, userById, postUserCtrl, putUserCtrl, loginUserCtrl } from '../controllers/user';
const { checkToken } = require('../utils/middelwares')
const router = express.Router()

router.get('/', getUsersCtrl)
router.get('/:id', userById)
router.post('/', checkToken, postUserCtrl)
router.post('/login', loginUserCtrl)
router.put('/', putUserCtrl)

export default router