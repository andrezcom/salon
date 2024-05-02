import express from 'express'
import { getProductsCtrl, productById, postProductCtrl, putProductCtrl } from '../controllers/product'
const router = express.Router()

router.get('/', getProductsCtrl)
router.get('/:id', productById)
router.post('/', postProductCtrl)
router.put('/', putProductCtrl)

export default router