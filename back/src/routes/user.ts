import express from 'express'
import { getUsersCtrl, userById, postUserCtrl, putUserCtrl, loginUserCtrl, deleteUserCtrl } from '../controllers/user';
/* import checkToken from '../utils/middelwares'; */

const router = express.Router()

router.get('/', getUsersCtrl)
router.get('/:id', userById)
router.post('/', postUserCtrl)
router.post('/login', loginUserCtrl)
router.put('/', putUserCtrl)
router.delete('/:id', deleteUserCtrl)

export default router