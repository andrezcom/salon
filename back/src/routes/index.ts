import express from 'express';

import authRouter from './auth'
import productRouter from './product'
import serviceRouter from './service'
import paymentRouter from './payment'
import providerRouter from './provider'
import saleRouter from './sale'
import saleUpdatedRouter from './saleUpdated'
import businessRouter from './business'
import cashBalanceRouter from './cashBalance'
import commissionRouter from './commission'
import dashboardRouter from './dashboard'
import cashTransactionRouter from './cashTransaction'
import advanceRouter from './advance'
import expenseRouter from './expense'
import inventoryRouter from './inventory'
import purchaseOrderRouter from './purchaseOrder'
import businessProfileRouter from './businessProfile'
import personRouter from './person'

const router = express.Router();
router.use('/auth', authRouter)
router.use('/product', productRouter)
router.use('/service', serviceRouter)
router.use('/payment', paymentRouter)
router.use('/provider', providerRouter)
router.use('/sale', saleRouter)
router.use('/api', saleUpdatedRouter)
router.use('/business', businessRouter)
router.use('/cash-balance', cashBalanceRouter)
router.use('/commission', commissionRouter)
router.use('/dashboard', dashboardRouter)
router.use('/cash-transaction', cashTransactionRouter)
router.use('/advance', advanceRouter)
router.use('/expense', expenseRouter)
router.use('/inventory', inventoryRouter)
router.use('/purchase-order', purchaseOrderRouter)
router.use('/api', businessProfileRouter)
router.use('/api', personRouter)

export default router