import { Request, Response } from 'express';
import { BusinessService } from '../services/businessService';

// Controlador para operaciones de clientes en un negocio específico
export const createClientInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const clientData = req.body;

    const client = await BusinessService.createClient(businessId, clientData);

    return res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente en el negocio',
      data: client
    });

  } catch (error) {
    console.error('Error creando cliente en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getClientsInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const clients = await BusinessService.getClients(businessId, filters);

    return res.status(200).json({
      success: true,
      data: clients
    });

  } catch (error) {
    console.error('Error obteniendo clientes del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Controlador para operaciones de servicios en un negocio específico
export const createServiceInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const serviceData = req.body;

    const service = await BusinessService.createService(businessId, serviceData);

    return res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente en el negocio',
      data: service
    });

  } catch (error) {
    console.error('Error creando servicio en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getServicesInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const services = await BusinessService.getServices(businessId, filters);

    return res.status(200).json({
      success: true,
      data: services
    });

  } catch (error) {
    console.error('Error obteniendo servicios del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Controlador para operaciones de productos en un negocio específico
export const createProductInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const productData = req.body;

    const product = await BusinessService.createProduct(businessId, productData);

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente en el negocio',
      data: product
    });

  } catch (error) {
    console.error('Error creando producto en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getProductsInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const products = await BusinessService.getProducts(businessId, filters);

    return res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error obteniendo productos del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Controlador para operaciones de expertos en un negocio específico
export const createExpertInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const expertData = req.body;

    const expert = await BusinessService.createExpert(businessId, expertData);

    return res.status(201).json({
      success: true,
      message: 'Experto creado exitosamente en el negocio',
      data: expert
    });

  } catch (error) {
    console.error('Error creando experto en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getExpertsInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const experts = await BusinessService.getExperts(businessId, filters);

    return res.status(200).json({
      success: true,
      data: experts
    });

  } catch (error) {
    console.error('Error obteniendo expertos del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Controlador para operaciones de proveedores en un negocio específico
export const createProviderInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const providerData = req.body;

    const provider = await BusinessService.createProvider(businessId, providerData);

    return res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente en el negocio',
      data: provider
    });

  } catch (error) {
    console.error('Error creando proveedor en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getProvidersInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const providers = await BusinessService.getProviders(businessId, filters);

    return res.status(200).json({
      success: true,
      data: providers
    });

  } catch (error) {
    console.error('Error obteniendo proveedores del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Controlador para operaciones de métodos de pago en un negocio específico
export const createPaymentInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const paymentData = req.body;

    const payment = await BusinessService.createPayment(businessId, paymentData);

    return res.status(201).json({
      success: true,
      message: 'Método de pago creado exitosamente en el negocio',
      data: payment
    });

  } catch (error) {
    console.error('Error creando método de pago en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getPaymentsInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const payments = await BusinessService.getPayments(businessId, filters);

    return res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error obteniendo métodos de pago del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Controlador para operaciones de ventas en un negocio específico
export const createSaleInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const saleData = req.body;

    const sale = await BusinessService.createSale(businessId, saleData);

    return res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente en el negocio',
      data: sale
    });

  } catch (error) {
    console.error('Error creando venta en el negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getSalesInBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const filters = req.query;

    const sales = await BusinessService.getSales(businessId, filters);

    return res.status(200).json({
      success: true,
      data: sales
    });

  } catch (error) {
    console.error('Error obteniendo ventas del negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Nuevas funciones para el sistema de facturación
export const changeSaleStatus = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const saleId = req.params.saleId;
    const { newStatus, notes, userId } = req.body;

    if (!newStatus || !['abierta', 'en_proceso', 'cerrada'].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: abierta, en_proceso, o cerrada'
      });
    }

    const updatedSale = await BusinessService.changeSaleStatus(businessId, saleId, newStatus, userId, notes);

    return res.status(200).json({
      success: true,
      message: `Estado de la venta cambiado a: ${newStatus}`,
      data: updatedSale
    });

  } catch (error) {
    console.error('Error cambiando estado de la venta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const closeSaleTransaction = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const saleId = req.params.saleId;
    const { notes, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido para cerrar la transacción'
      });
    }

    const closedSale = await BusinessService.closeSaleTransaction(businessId, saleId, userId, notes);

    return res.status(200).json({
      success: true,
      message: 'Transacción cerrada exitosamente y factura generada',
      data: closedSale
    });

  } catch (error) {
    console.error('Error cerrando transacción:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getSalesByStatus = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const status = req.query.status as string;

    if (status && !['abierta', 'en_proceso', 'cerrada'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: abierta, en_proceso, o cerrada'
      });
    }

    const sales = await BusinessService.getSalesByStatus(businessId, status);

    return res.status(200).json({
      success: true,
      data: sales
    });

  } catch (error) {
    console.error('Error obteniendo ventas por estado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getNextInvoiceNumber = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;

    const nextNumber = await BusinessService.getNextInvoiceNumber(businessId);

    return res.status(200).json({
      success: true,
      data: { nextInvoiceNumber: nextNumber }
    });

  } catch (error) {
    console.error('Error obteniendo próximo número de factura:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
