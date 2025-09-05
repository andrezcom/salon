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
import loyaltyRouter from './loyalty'
import clientRetentionRouter from './clientRetention'
import businessProfileRouter from './businessProfile'
import personRouter from './person'
import payrollRouter from './payroll'
import supplierRouter from './supplier'
import supplierComparisonRouter from './supplierComparison'
import supplierDashboardRouter from './supplierDashboard'
import accountsPayableRouter from './accountsPayable'
import purchaseOrderRouter from './purchaseOrder'
import inventoryRouter from './inventory'
import colorPaletteRouter from './colorPalette'
import payrollReportRouter from './payrollReport'
import attendanceRouter from './attendance'
import absenceRouter from './absence'
import payrollAutomationRouter from './payrollAutomation'
import commissionPeriodRouter from './commissionPeriod'
import commissionPeriodReportRouter from './commissionPeriodReport'

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
router.use('/payroll', payrollRouter)
router.use('/suppliers', supplierRouter)
router.use('/supplier-comparisons', supplierComparisonRouter)
router.use('/supplier-dashboard', supplierDashboardRouter)
router.use('/accounts-payable', accountsPayableRouter)
router.use('/purchase-orders', purchaseOrderRouter)
router.use('/inventory', inventoryRouter)
router.use('/loyalty', loyaltyRouter)
router.use('/client-retention', clientRetentionRouter)
router.use('/color-palette', colorPaletteRouter)
router.use('/payroll-reports', payrollReportRouter)
router.use('/attendance', attendanceRouter)
router.use('/absence', absenceRouter)
router.use('/payroll-automation', payrollAutomationRouter)
router.use('/commission-periods', commissionPeriodRouter)
router.use('/commission-period-reports', commissionPeriodReportRouter)

export default router