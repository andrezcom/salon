import express from 'express'
import { login, code } from '../controllers/auth'
const router = express.Router()

router.get('/login', (_req, res) => {
  res.send('login')
})
router.post('/login/:email', login)
router.post('/login/:email/code', code)

export default router
