import { Request, Response } from 'express';
import SupplierComparison from '../models/supplierComparison';
import Supplier from '../models/supplier';
import Product from '../models/product';
import AccountsPayable from '../models/accountsPayable';
import PurchaseOrder from '../models/purchaseOrder';

export class SupplierComparisonController {
  
  // Crear comparación de proveedores
  static async createComparison(req: Request, res: Response): Promise<void> {
    try {
      const {
        comparisonName,
        productId,
        category,
        supplierIds,
        comparisonConfig
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

      // Obtener información de proveedores
      const suppliers = await Supplier.find({
        _id: { $in: supplierIds },
        businessId,
        status: 'active'
      });

      if (suppliers.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No se encontraron proveedores válidos'
        });
        return;
      }

      // Generar comparación
      const comparison = await SupplierComparisonController.generateComparisonData(
        businessId,
        suppliers,
        productId,
        category,
        comparisonConfig
      );

      const comparisonDoc = new SupplierComparison({
        businessId,
        comparisonName,
        productId,
        category,
        suppliers: comparison.suppliers,
        analysis: comparison.analysis,
        comparisonConfig: comparisonConfig || {
          weightFactors: {
            price: 0.3,
            quality: 0.3,
            delivery: 0.2,
            service: 0.2
          },
          includeInactive: false,
          minimumRating: 3,
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 días atrás
            endDate: new Date()
          }
        },
        createdBy
      });

      await comparisonDoc.save();

      res.status(201).json({
        success: true,
        message: 'Comparación de proveedores creada exitosamente',
        data: comparisonDoc
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener comparaciones
  static async getComparisons(req: Request, res: Response): Promise<void> {
    try {
      const {
        businessId,
        productId,
        category,
        page = 1,
        limit = 10
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
      
      if (productId) {
        filters.productId = productId;
      }
      
      if (category) {
        filters.category = category;
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const comparisons = await SupplierComparison.find(filters)
        .populate('productId', 'name sku')
        .populate('createdBy', 'firstName lastName')
        .sort({ comparisonDate: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await SupplierComparison.countDocuments(filters);

      res.status(200).json({
        success: true,
        message: 'Comparaciones obtenidas exitosamente',
        data: {
          comparisons,
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

  // Obtener comparación por ID
  static async getComparisonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId;

      const comparison = await SupplierComparison.findOne({ _id: id, businessId })
        .populate('productId', 'name sku category')
        .populate('createdBy', 'firstName lastName')
        .populate('suppliers.supplierId', 'name code contact rating');

      if (!comparison) {
        res.status(404).json({
          success: false,
          message: 'Comparación no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Comparación obtenida exitosamente',
        data: comparison
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Generar comparación automática por producto
  static async generateProductComparison(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { comparisonConfig } = req.body;
      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      // Obtener producto
      const product = await Product.findOne({ _id: productId, businessId });
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // Obtener proveedores del producto
      const supplierIds = product.suppliers.map(s => s.supplierId);
      const suppliers = await Supplier.find({
        _id: { $in: supplierIds },
        businessId,
        status: 'active'
      });

      if (suppliers.length === 0) {
        res.status(400).json({
          success: false,
          message: 'El producto no tiene proveedores activos'
        });
        return;
      }

      // Generar comparación
      const comparison = await SupplierComparisonController.generateComparisonData(
        businessId,
        suppliers,
        productId,
        product.category,
        comparisonConfig
      );

      const comparisonDoc = new SupplierComparison({
        businessId,
        comparisonName: `Comparación de proveedores - ${product.name}`,
        productId,
        category: product.category,
        suppliers: comparison.suppliers,
        analysis: comparison.analysis,
        comparisonConfig: comparisonConfig || {
          weightFactors: {
            price: 0.3,
            quality: 0.3,
            delivery: 0.2,
            service: 0.2
          },
          includeInactive: false,
          minimumRating: 3,
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        },
        createdBy
      });

      await comparisonDoc.save();

      res.status(201).json({
        success: true,
        message: 'Comparación automática generada exitosamente',
        data: comparisonDoc
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Generar comparación automática por categoría
  static async generateCategoryComparison(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { comparisonConfig } = req.body;
      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      // Obtener productos de la categoría
      const products = await Product.find({
        businessId,
        category,
        isActive: true
      });

      if (products.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No se encontraron productos en esta categoría'
        });
        return;
      }

      // Obtener todos los proveedores únicos de la categoría
      const allSupplierIds = new Set();
      products.forEach(product => {
        product.suppliers.forEach(supplier => {
          allSupplierIds.add(supplier.supplierId.toString());
        });
      });

      const suppliers = await Supplier.find({
        _id: { $in: Array.from(allSupplierIds) },
        businessId,
        status: 'active'
      });

      if (suppliers.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No se encontraron proveedores activos para esta categoría'
        });
        return;
      }

      // Generar comparación
      const comparison = await SupplierComparisonController.generateComparisonData(
        businessId,
        suppliers,
        null,
        category,
        comparisonConfig
      );

      const comparisonDoc = new SupplierComparison({
        businessId,
        comparisonName: `Comparación de proveedores - Categoría ${category}`,
        category,
        suppliers: comparison.suppliers,
        analysis: comparison.analysis,
        comparisonConfig: comparisonConfig || {
          weightFactors: {
            price: 0.3,
            quality: 0.3,
            delivery: 0.2,
            service: 0.2
          },
          includeInactive: false,
          minimumRating: 3,
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        },
        createdBy
      });

      await comparisonDoc.save();

      res.status(201).json({
        success: true,
        message: 'Comparación por categoría generada exitosamente',
        data: comparisonDoc
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Método privado para generar datos de comparación
  private static async generateComparisonData(
    businessId: string,
    suppliers: any[],
    productId?: string,
    category?: string,
    config?: any
  ) {
    const comparisonData = {
      suppliers: [],
      analysis: {
        bestPrice: null,
        bestQuality: null,
        bestDelivery: null,
        bestService: null,
        bestOverall: null,
        recommendations: [],
        riskAnalysis: {
          lowRisk: [],
          mediumRisk: [],
          highRisk: [],
          riskFactors: []
        },
        executiveSummary: {
          totalSuppliers: suppliers.length,
          averagePrice: 0,
          priceRange: { min: 0, max: 0, difference: 0 },
          qualityRange: { min: 0, max: 0 },
          deliveryRange: { min: 0, max: 0 },
          keyInsights: [],
          finalRecommendation: ''
        }
      }
    };

    // Procesar cada proveedor
    for (const supplier of suppliers) {
      const supplierData = await SupplierComparisonController.getSupplierData(
        businessId,
        supplier,
        productId,
        category
      );
      comparisonData.suppliers.push(supplierData);
    }

    // Calcular análisis comparativo
    comparisonData.analysis = await SupplierComparisonController.calculateAnalysis(
      comparisonData.suppliers,
      config
    );

    return comparisonData;
  }

  // Método privado para obtener datos de un proveedor
  private static async getSupplierData(
    businessId: string,
    supplier: any,
    productId?: string,
    category?: string
  ) {
    // Obtener datos de productos del proveedor
    const productFilter: any = {
      businessId,
      'suppliers.supplierId': supplier._id,
      isActive: true
    };

    if (productId) {
      productFilter._id = productId;
    } else if (category) {
      productFilter.category = category;
    }

    const products = await Product.find(productFilter);
    
    // Calcular métricas del proveedor
    const pricing = SupplierComparisonController.calculatePricingMetrics(products, supplier._id);
    const delivery = SupplierComparisonController.calculateDeliveryMetrics(supplier);
    const quality = SupplierComparisonController.calculateQualityMetrics(supplier);
    const service = SupplierComparisonController.calculateServiceMetrics(supplier);
    const commercial = SupplierComparisonController.calculateCommercialMetrics(supplier);

    return {
      supplierId: supplier._id,
      supplierName: supplier.name,
      supplierCode: supplier.code,
      pricing,
      delivery,
      quality,
      service,
      commercial,
      overallScore: 0, // Se calculará después
      recommendation: 'acceptable', // Se calculará después
      pros: [],
      cons: [],
      notes: ''
    };
  }

  // Métodos privados para calcular métricas
  private static calculatePricingMetrics(products: any[], supplierId: string) {
    const supplierProducts = products.filter(p => 
      p.suppliers.some(s => s.supplierId.toString() === supplierId.toString())
    );

    if (supplierProducts.length === 0) {
      return {
        unitPrice: 0,
        minimumOrder: 0,
        volumeDiscounts: [],
        shippingCost: 0,
        taxAmount: 0,
        totalCost: 0,
        costPerUnit: 0
      };
    }

    const supplierData = supplierProducts[0].suppliers.find(
      s => s.supplierId.toString() === supplierId.toString()
    );

    return {
      unitPrice: supplierData?.costPrice || 0,
      minimumOrder: supplierData?.minimumOrder || 0,
      volumeDiscounts: [],
      shippingCost: 0,
      taxAmount: 0,
      totalCost: supplierData?.costPrice || 0,
      costPerUnit: supplierData?.costPrice || 0
    };
  }

  private static calculateDeliveryMetrics(supplier: any) {
    return {
      leadTime: 7, // Valor por defecto
      reliability: 95, // Valor por defecto
      deliveryOptions: ['Estándar'],
      deliveryGuarantee: false,
      expeditedDelivery: false
    };
  }

  private static calculateQualityMetrics(supplier: any) {
    return {
      rating: supplier.rating || 3,
      defectRate: 2, // Valor por defecto
      returnRate: 1, // Valor por defecto
      certifications: [],
      qualityGuarantee: false,
      warrantyPeriod: 0
    };
  }

  private static calculateServiceMetrics(supplier: any) {
    return {
      responseTime: 24, // Horas por defecto
      communicationScore: supplier.rating || 3,
      supportLevel: 'standard',
      technicalSupport: false,
      trainingProvided: false,
      documentationQuality: 3
    };
  }

  private static calculateCommercialMetrics(supplier: any) {
    return {
      paymentTerms: supplier.terms?.paymentTerms || 30,
      creditLimit: supplier.terms?.creditLimit || 0,
      discountPercentage: supplier.terms?.discountPercentage || 0,
      latePaymentFee: supplier.terms?.latePaymentFee || 0,
      contractRequired: false,
      minimumContractValue: 0
    };
  }

  // Método privado para calcular análisis comparativo
  private static async calculateAnalysis(suppliers: any[], config?: any) {
    if (suppliers.length === 0) {
      return {
        bestPrice: null,
        bestQuality: null,
        bestDelivery: null,
        bestService: null,
        bestOverall: null,
        recommendations: [],
        riskAnalysis: {
          lowRisk: [],
          mediumRisk: [],
          highRisk: [],
          riskFactors: []
        },
        executiveSummary: {
          totalSuppliers: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0, difference: 0 },
          qualityRange: { min: 0, max: 0 },
          deliveryRange: { min: 0, max: 0 },
          keyInsights: [],
          finalRecommendation: ''
        }
      };
    }

    // Calcular puntuaciones generales
    const prices = suppliers.map(s => s.pricing.costPerUnit);
    const qualities = suppliers.map(s => s.quality.rating);
    const deliveries = suppliers.map(s => s.delivery.leadTime);

    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Encontrar mejores en cada categoría
    const bestPrice = suppliers.find(s => s.pricing.costPerUnit === minPrice);
    const bestQuality = suppliers.find(s => s.quality.rating === Math.max(...qualities));
    const bestDelivery = suppliers.find(s => s.delivery.leadTime === Math.min(...deliveries));

    // Calcular puntuación general para cada proveedor
    suppliers.forEach(supplier => {
      const priceScore = Math.max(0, 100 - (supplier.pricing.costPerUnit / averagePrice) * 100);
      const qualityScore = (supplier.quality.rating / 5) * 100;
      const deliveryScore = supplier.delivery.reliability;
      const serviceScore = (supplier.service.communicationScore / 5) * 100;

      supplier.overallScore = Math.round(
        priceScore * 0.3 +
        qualityScore * 0.3 +
        deliveryScore * 0.2 +
        serviceScore * 0.2
      );

      // Determinar recomendación
      if (supplier.overallScore >= 90) supplier.recommendation = 'best';
      else if (supplier.overallScore >= 75) supplier.recommendation = 'good';
      else if (supplier.overallScore >= 60) supplier.recommendation = 'acceptable';
      else supplier.recommendation = 'poor';
    });

    const bestOverall = suppliers.find(s => s.overallScore === Math.max(...suppliers.map(s => s.overallScore)));

    return {
      bestPrice: bestPrice ? {
        supplierId: bestPrice.supplierId,
        supplierName: bestPrice.supplierName,
        totalCost: bestPrice.pricing.totalCost,
        savings: maxPrice - minPrice
      } : null,
      bestQuality: bestQuality ? {
        supplierId: bestQuality.supplierId,
        supplierName: bestQuality.supplierName,
        qualityScore: bestQuality.quality.rating * 20
      } : null,
      bestDelivery: bestDelivery ? {
        supplierId: bestDelivery.supplierId,
        supplierName: bestDelivery.supplierName,
        leadTime: bestDelivery.delivery.leadTime,
        reliability: bestDelivery.delivery.reliability
      } : null,
      bestService: suppliers.find(s => s.service.communicationScore === Math.max(...suppliers.map(s => s.service.communicationScore))) ? {
        supplierId: suppliers.find(s => s.service.communicationScore === Math.max(...suppliers.map(s => s.service.communicationScore))).supplierId,
        supplierName: suppliers.find(s => s.service.communicationScore === Math.max(...suppliers.map(s => s.service.communicationScore))).supplierName,
        serviceScore: Math.max(...suppliers.map(s => s.service.communicationScore)) * 20
      } : null,
      bestOverall: bestOverall ? {
        supplierId: bestOverall.supplierId,
        supplierName: bestOverall.supplierName,
        overallScore: bestOverall.overallScore
      } : null,
      recommendations: [],
      riskAnalysis: {
        lowRisk: [],
        mediumRisk: [],
        highRisk: [],
        riskFactors: []
      },
      executiveSummary: {
        totalSuppliers: suppliers.length,
        averagePrice,
        priceRange: { min: minPrice, max: maxPrice, difference: maxPrice - minPrice },
        qualityRange: { min: Math.min(...qualities), max: Math.max(...qualities) },
        deliveryRange: { min: Math.min(...deliveries), max: Math.max(...deliveries) },
        keyInsights: [
          `El proveedor con mejor precio es ${bestPrice?.supplierName}`,
          `El proveedor con mejor calidad es ${bestQuality?.supplierName}`,
          `El proveedor con mejor entrega es ${bestDelivery?.supplierName}`
        ],
        finalRecommendation: bestOverall ? 
          `Recomendamos ${bestOverall.supplierName} como el mejor proveedor general con una puntuación de ${bestOverall.overallScore}/100` :
          'No se pudo determinar una recomendación'
      }
    };
  }
}
