import express from 'express';
import {
  createBusiness,
  getUserBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessStats
} from '../controllers/business';
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
  getSalesInBusiness,
  // Nuevas funciones de facturación
  changeSaleStatus,
  closeSaleTransaction,
  getSalesByStatus,
  getNextInvoiceNumber
} from '../controllers/businessOperations';


const router = express.Router();

// Ruta de prueba simple (DEBE ir ANTES de las rutas con parámetros)
router.get('/test', (_req, res) => {
  res.json({ message: 'Ruta de business funcionando correctamente' });
});

// Obtener todos los negocios de un usuario (DEBE ir ANTES de las rutas con parámetros)
router.get('/user/:userId', getUserBusinesses);

// Crear un nuevo negocio
router.post('/', createBusiness);

// Listar todos los negocios (ruta básica para pruebas)
router.get('/', (_req, res) => {
  res.json({ message: 'API de negocios funcionando correctamente', endpoints: [
    'POST / - Crear negocio',
    'GET /user/:userId - Obtener negocios de usuario',
    'GET /:id - Obtener negocio específico',
    'PUT /:id - Actualizar negocio',
    'DELETE /:id - Eliminar negocio',
    'GET /:id/stats - Estadísticas del negocio',
    'POST /:businessId/clients - Crear cliente en negocio',
    'GET /:businessId/clients - Obtener clientes del negocio',
    'POST /:businessId/services - Crear servicio en negocio',
    'GET /:businessId/services - Obtener servicios del negocio',
    'POST /:businessId/products - Crear producto en negocio',
    'GET /:businessId/products - Obtener productos del negocio',
    'POST /:businessId/experts - Crear experto en negocio',
    'GET /:businessId/experts - Obtener expertos del negocio',
    'POST /:businessId/providers - Crear proveedor en negocio',
    'GET /:businessId/providers - Obtener proveedores del negocio',
    'POST /:businessId/payments - Crear método de pago en negocio',
    'GET /:businessId/payments - Obtener métodos de pago del negocio',
    'POST /:businessId/sales - Crear venta en negocio',
    'GET /:businessId/sales - Obtener ventas del negocio',
    'PUT /:businessId/sales/:saleId/status - Cambiar estado de venta',
    'PUT /:businessId/sales/:saleId/close - Cerrar transacción y generar factura',
    'GET /:businessId/sales/status - Obtener ventas por estado',
    'GET /:businessId/sales/next-invoice - Obtener próximo número de factura'
  ]});
});

// Obtener un negocio específico
router.get('/:id', getBusinessById);

// Actualizar un negocio
router.put('/:id', updateBusiness);

// Eliminar un negocio
router.delete('/:id', deleteBusiness);

// Obtener estadísticas de un negocio
router.get('/:id/stats', getBusinessStats);

// Rutas para operaciones específicas del negocio
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

// Nuevas rutas para el sistema de facturación
router.put('/:businessId/sales/:saleId/status', changeSaleStatus);
router.put('/:businessId/sales/:saleId/close', closeSaleTransaction);
router.get('/:businessId/sales/status', getSalesByStatus);
router.get('/:businessId/sales/next-invoice', getNextInvoiceNumber);

export default router;
