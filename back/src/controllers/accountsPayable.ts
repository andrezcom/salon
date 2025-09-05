import { Request, Response } from 'express';
import AccountsPayable from '../models/accountsPayable';
import Supplier from '../models/supplier';

export class AccountsPayableController {
  
  // Crear cuenta por pagar
  static async createAccountPayable(req: Request, res: Response): Promise<void> {
    try {
      const {
        supplierId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentTerms,
        items,
        notes
      } = req.body;

      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      // Verificar que el proveedor existe
      const supplier = await Supplier.findOne({ _id: supplierId, businessId });
      if (!supplier) {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
        return;
      }

      // Verificar que no existe una factura con el mismo número
      const existingInvoice = await AccountsPayable.findOne({
        businessId,
        supplierId,
        invoiceNumber
      });

      if (existingInvoice) {
        res.status(400).json({
          success: false,
          message: 'Ya existe una factura con este número para este proveedor'
        });
        return;
      }

      const accountPayable = new AccountsPayable({
        businessId,
        supplierId,
        supplierName: supplier.name,
        supplierCode: supplier.code,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal,
        taxAmount: taxAmount || 0,
        discountAmount: discountAmount || 0,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: 'pending',
        paymentTerms: paymentTerms || 30,
        items: items || [],
        notes,
        createdBy
      });

      await accountPayable.save();

      res.status(201).json({
        success: true,
        message: 'Cuenta por pagar creada exitosamente',
        data: accountPayable
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener cuentas por pagar
  static async getAccountsPayable(req: Request, res: Response): Promise<void> {
    try {
      const {
        businessId,
        supplierId,
        status,
        page = 1,
        limit = 10,
        startDate,
        endDate
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
      
      if (supplierId) {
        filters.supplierId = supplierId;
      }
      
      if (status) {
        filters.status = status;
      }
      
      if (startDate && endDate) {
        filters.invoiceDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const accountsPayable = await AccountsPayable.find(filters)
        .populate('supplierId', 'name code contact.email')
        .populate('createdBy', 'firstName lastName')
        .populate('paidBy', 'firstName lastName')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await AccountsPayable.countDocuments(filters);

      res.status(200).json({
        success: true,
        message: 'Cuentas por pagar obtenidas exitosamente',
        data: {
          accountsPayable,
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

  // Obtener cuenta por pagar por ID
  static async getAccountPayableById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const accountPayable = await AccountsPayable.findOne({ _id: id, businessId })
        .populate('supplierId', 'name code contact.email contact.phone')
        .populate('createdBy', 'firstName lastName')
        .populate('paidBy', 'firstName lastName');

      if (!accountPayable) {
        res.status(404).json({
          success: false,
          message: 'Cuenta por pagar no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Cuenta por pagar obtenida exitosamente',
        data: accountPayable
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Procesar pago
  static async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        amount,
        paymentMethod,
        paymentReference,
        notes
      } = req.body;

      const businessId = req.user?.businessId;
      const paidBy = req.user?.id;

      if (!businessId || !paidBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y paidBy son requeridos'
        });
        return;
      }

      const accountPayable = await AccountsPayable.findOne({ _id: id, businessId });

      if (!accountPayable) {
        res.status(404).json({
          success: false,
          message: 'Cuenta por pagar no encontrada'
        });
        return;
      }

      if (accountPayable.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'No se puede procesar pago en una cuenta cancelada'
        });
        return;
      }

      // Procesar el pago
      await accountPayable.recordPayment(
        amount,
        paymentMethod,
        paymentReference,
        paidBy
      );

      // Agregar notas si se proporcionan
      if (notes) {
        accountPayable.internalNotes = (accountPayable.internalNotes || '') + `\nPago: ${notes}`;
        await accountPayable.save();
      }

      res.status(200).json({
        success: true,
        message: 'Pago procesado exitosamente',
        data: {
          accountPayable,
          paymentAmount: amount,
          newBalance: accountPayable.balanceAmount
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

  // Obtener facturas vencidas
  static async getOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const overdueInvoices = await AccountsPayable.getOverdueInvoices(businessId);

      res.status(200).json({
        success: true,
        message: 'Facturas vencidas obtenidas exitosamente',
        data: {
          overdueInvoices,
          totalOverdue: overdueInvoices.length,
          totalAmount: overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)
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

  // Obtener resumen por proveedor
  static async getSupplierSummary(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const summary = await AccountsPayable.getSupplierSummary(businessId, supplierId);

      res.status(200).json({
        success: true,
        message: 'Resumen del proveedor obtenido exitosamente',
        data: summary[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          paidAmount: 0,
          balanceAmount: 0,
          overdueAmount: 0
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

  // Obtener resumen general
  static async getGeneralSummary(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const summary = await AccountsPayable.getGeneralSummary(businessId);

      res.status(200).json({
        success: true,
        message: 'Resumen general obtenido exitosamente',
        data: summary[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          paidAmount: 0,
          balanceAmount: 0,
          overdueCount: 0,
          overdueAmount: 0
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

  // Cancelar cuenta por pagar
  static async cancelAccountPayable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const accountPayable = await AccountsPayable.findOne({ _id: id, businessId });

      if (!accountPayable) {
        res.status(404).json({
          success: false,
          message: 'Cuenta por pagar no encontrada'
        });
        return;
      }

      if (accountPayable.status === 'paid') {
        res.status(400).json({
          success: false,
          message: 'No se puede cancelar una cuenta ya pagada'
        });
        return;
      }

      await accountPayable.cancel(reason);

      res.status(200).json({
        success: true,
        message: 'Cuenta por pagar cancelada exitosamente',
        data: {
          accountPayable,
          status: accountPayable.status
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

  // Actualizar cuenta por pagar
  static async updateAccountPayable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const businessId = req.user?.businessId;
      const updatedBy = req.user?.id;

      if (!businessId || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y updatedBy son requeridos'
        });
        return;
      }

      const accountPayable = await AccountsPayable.findOne({ _id: id, businessId });

      if (!accountPayable) {
        res.status(404).json({
          success: false,
          message: 'Cuenta por pagar no encontrada'
        });
        return;
      }

      if (accountPayable.status === 'paid' || accountPayable.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'No se puede actualizar una cuenta pagada o cancelada'
        });
        return;
      }

      // Actualizar campos permitidos
      const allowedFields = ['notes', 'internalNotes'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          accountPayable[field] = updateData[field];
        }
      });

      accountPayable.updatedBy = updatedBy;
      await accountPayable.save();

      res.status(200).json({
        success: true,
        message: 'Cuenta por pagar actualizada exitosamente',
        data: accountPayable
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
