import express from 'express'
import { getExpertsCtrl, expertById, postExpertCtrl, putExpertCtrl } from '../controllers/expert'
const router = express.Router()

router.get('/', getExpertsCtrl)
router.get('/:id', expertById)
router.post('/', postExpertCtrl)
router.put('/', putExpertCtrl)

export default router