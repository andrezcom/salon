import express from 'express'
import { getUsers, userById, postUser, putUser } from '../controllers/user'
const router = express.Router()

router.get('/', getUsers)
router.get('/:id', userById)
router.post('/', postUser)
router.put('/', putUser)

export default router