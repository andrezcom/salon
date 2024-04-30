import express from 'express'
import { getExperts, findExpertById, addExpert } from '../services/experts/expertsServ';


const router = express.Router()

router.get('/', (_req, res) => {
  res.send(getExperts())
})

router.get('/:id', (req, res) => {
  const expertId = findExpertById(+req.params.id)
  return (expertId != null)
    ? res.send(expertId)
    : res.sendStatus(404)
})
router.post('/', (req, res) => {
  const { name, email, document, movil, active } = req.body
  const newExpert = addExpert(
    name,
    email,
    document,
    movil,
    active
  )
  res.json(newExpert)
})

export default router
