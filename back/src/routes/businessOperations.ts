import express from 'express';
import {
  // Clientes
  createClientInBusiness,
  getClientsInBusiness,
  // Servicios
  createServiceInBusiness,
  getServicesInBusiness,
  // Productos
  createProductInBusiness,
  getProductsInBusiness,
  // Expertos
  createExpertInBusiness,
  getExpertsInBusiness,
  // Proveedores
  createProviderInBusiness,
  getProvidersInBusiness,
  // Métodos de pago
  createPaymentInBusiness,
  getPaymentsInBusiness,
  // Ventas
  createSaleInBusiness,
  getSalesInBusiness
} from '../controllers/businessOperations';

const router = express.Router();

// Todas las rutas requieren un businessId
// Formato: /api/business/:businessId/...

// Rutas para clientes
router.post('/:businessId/clients', createClientInBusiness);
router.get('/:businessId/clients', getClientsInBusiness);

// Rutas para servicios
router.post('/:businessId/services', createServiceInBusiness);
router.get('/:businessId/services', getServicesInBusiness);

// Rutas para productos
router.post('/:businessId/products', createProductInBusiness);
router.get('/:businessId/products', getProductsInBusiness);

// Rutas para expertos
router.post('/:businessId/experts', createExpertInBusiness);
router.get('/:businessId/experts', getExpertsInBusiness);

// Rutas para proveedores
router.post('/:businessId/providers', createProviderInBusiness);
router.get('/:businessId/providers', getProvidersInBusiness);

// Rutas para métodos de pago
router.post('/:businessId/payments', createPaymentInBusiness);
router.get('/:businessId/payments', getPaymentsInBusiness);

// Rutas para ventas
router.post('/:businessId/sales', createSaleInBusiness);
router.get('/:businessId/sales', getSalesInBusiness);

export default router;
