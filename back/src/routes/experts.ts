import express from 'express'

const router = express.Router()

router.get('/', (_req, res) => {
  res.send('expert.getExperts')
})
router.post('/', (_req, res) => {
  res.send('parsing data...')
})

export default router
