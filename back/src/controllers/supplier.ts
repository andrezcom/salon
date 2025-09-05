import { Request, Response } from 'express';
import Supplier from '../models/supplier';
import Product from '../models/product';
import AccountsPayable from '../models/accountsPayable';
import PurchaseOrder from '../models/purchaseOrder';

export class SupplierController {
  
  // Crear nuevo proveedor
  static async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        type,
        contact,
        address,
        taxInfo,
        terms,
        banking,
        notes
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      // Verificar que no exista un proveedor con el mismo nombre
      const existingSupplier = await Supplier.findOne({
        businessId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (existingSupplier) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con este nombre'
        });
        return;
      }

      const supplier = new Supplier({
        businessId,
        name,
        type,
        contact,
        address,
        taxInfo,
        terms,
        banking,
        notes,
        createdBy
      });

      await supplier.save();

      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: supplier
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener todos los proveedores
  static async getSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const {
        businessId,
        status,
        type,
        page = 1,
        limit = 10,
        search
      } = req.query;

      const businessIdFilter = businessId || req.user?.businessId;
      
      if (!businessIdFilter) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Construir filtros
      const filters: any = { businessId: businessIdFilter };
      
      if (status) {
        filters.status = status;
      }
      
      if (type) {
        filters.type = type;
      }
      
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { 'contact.email': { $regex: search, $options: 'i' } }
        ];
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const suppliers = await Supplier.find(filters)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Supplier.countDocuments(filters);

      res.status(200).json({
        success: true,
        message: 'Proveedores obtenidos exitosamente',
        data: {
          suppliers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener proveedor por ID
  static async getSupplierById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const supplier = await Supplier.findOne({ _id: id, businessId })
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Proveedor obtenido exitosamente',
        data: supplier
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar proveedor
  static async updateSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const businessId = req.user?.businessId;
      const updatedBy = req.user?.id;

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      // Verificar nombre único si se está cambiando
      if (updateData.name && updateData.name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          businessId,
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: id }
        });

        if (existingSupplier) {
          res.status(400).json({
            success: false,
            message: 'Ya existe un proveedor con este nombre'
          });
          return;
        }
      }

      // Actualizar campos
      Object.assign(supplier, updateData);
      supplier.updatedBy = updatedBy;
      supplier.updatedAt = new Date();

      await supplier.save();

      res.status(200).json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: supplier
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar proveedor (soft delete)
  static async deleteSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      // Verificar si tiene productos asociados
      const productsWithSupplier = await Product.countDocuments({
        businessId,
        'suppliers.supplierId': id
      });

      if (productsWithSupplier > 0) {
        res.status(400).json({
          success: false,
          message: 'No se puede eliminar el proveedor porque tiene productos asociados'
        });
        return;
      }

      // Verificar si tiene cuentas por pagar pendientes
      const pendingAccounts = await AccountsPayable.countDocuments({
        businessId,
        supplierId: id,
        status: { $in: ['pending', 'partial', 'overdue'] }
      });

      if (pendingAccounts > 0) {
        res.status(400).json({
          success: false,
          message: 'No se puede eliminar el proveedor porque tiene cuentas por pagar pendientes'
        });
        return;
      }

      // Cambiar estado a inactivo
      supplier.status = 'inactive';
      await supplier.save();

      res.status(200).json({
        success: true,
        message: 'Proveedor eliminado exitosamente'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener productos de un proveedor
  static async getSupplierProducts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      const products = await Product.find({
        businessId,
        'suppliers.supplierId': id,
        isActive: true
      }).select('name sku category suppliers.$');

      res.status(200).json({
        success: true,
        message: 'Productos del proveedor obtenidos exitosamente',
        data: {
          supplier: {
            id: supplier._id,
            name: supplier.name,
            code: supplier.code
          },
          products
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen del proveedor
  static async getSupplierSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      // Obtener resumen de cuentas por pagar
      const accountsSummary = await AccountsPayable.getSupplierSummary(businessId, id);
      
      // Obtener resumen de órdenes de compra
      const ordersSummary = await PurchaseOrder.getSupplierSummary(businessId, id);
      
      // Contar productos asociados
      const productsCount = await Product.countDocuments({
        businessId,
        'suppliers.supplierId': id,
        isActive: true
      });

      res.status(200).json({
        success: true,
        message: 'Resumen del proveedor obtenido exitosamente',
        data: {
          supplier: {
            id: supplier._id,
            name: supplier.name,
            code: supplier.code,
            status: supplier.status,
            rating: supplier.rating
          },
          accountsPayable: accountsSummary[0] || {
            totalInvoices: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceAmount: 0,
            overdueAmount: 0
          },
          purchaseOrders: ordersSummary[0] || {
            totalOrders: 0,
            totalAmount: 0,
            completedOrders: 0,
            pendingOrders: 0
          },
          productsCount
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar calificación del proveedor
  static async updateSupplierRating(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const businessId = req.user?.businessId;

      if (rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          message: 'La calificación debe estar entre 1 y 5'
        });
        return;
      }

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      await supplier.updateRating(rating);

      res.status(200).json({
        success: true,
        message: 'Calificación actualizada exitosamente',
        data: {
          supplier: {
            id: supplier._id,
            name: supplier.name,
            rating: supplier.rating
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Suspender proveedor
  static async suspendSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const businessId = req.user?.businessId;

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      await supplier.suspend(reason);

      res.status(200).json({
        success: true,
        message: 'Proveedor suspendido exitosamente',
        data: {
          supplier: {
            id: supplier._id,
            name: supplier.name,
            status: supplier.status
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Reactivar proveedor
  static async activateSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const supplier = await Supplier.findOne({ _id: id, businessId });

      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      await supplier.activate();

      res.status(200).json({
        success: true,
        message: 'Proveedor reactivado exitosamente',
        data: {
          supplier: {
            id: supplier._id,
            name: supplier.name,
            status: supplier.status
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
