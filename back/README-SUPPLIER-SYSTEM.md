# 🏭 Sistema Completo de Proveedores y Cuentas por Pagar

## 📋 **Descripción General**

El sistema de proveedores implementa una gestión completa de proveedores, múltiples costos por proveedor en productos, cuentas por pagar y órdenes de compra. Permite manejar múltiples proveedores por producto con costos específicos, términos comerciales y flujos de aprobación.

## 🎯 **Características Principales**

### ✅ **Gestión de Proveedores:**

- **Información completa** del proveedor (contacto, dirección, fiscal)
- **Términos comerciales** (pago, crédito, descuentos)
- **Información bancaria** para pagos
- **Calificación** y estado del proveedor
- **Múltiples tipos** (manufacturer, distributor, wholesaler, retailer)

### ✅ **Múltiples Proveedores por Producto:**

- **Costos específicos** por proveedor
- **Pedidos mínimos** y tiempos de entrega
- **Proveedor preferido** por producto
- **Historial de compras** por proveedor
- **Notas específicas** del proveedor

### ✅ **Sistema de Cuentas por Pagar:**

- **Gestión de facturas** de proveedores
- **Estados de pago** (pending, partial, paid, overdue, cancelled)
- **Procesamiento de pagos** con referencias
- **Desglose de productos** en facturas
- **Documentos adjuntos**

### ✅ **Órdenes de Compra:**

- **Flujo de aprobación** (draft → sent → confirmed → completed)
- **Seguimiento de entregas** (parciales y completas)
- **Términos y condiciones** personalizables
- **Información de entrega** detallada

## 🏗️ **Arquitectura del Sistema**

### 📊 **Modelo Supplier:**

```typescript
interface ISupplier {
  businessId: string;
  name: string;
  code: string; // Código único
  type: "manufacturer" | "distributor" | "wholesaler" | "retailer";

  contact: {
    primaryContact: string;
    email: string;
    phone: string;
    mobile?: string;
    website?: string;
  };

  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  taxInfo: {
    taxId: string;
    taxName: string;
    taxAddress?: string;
    taxExempt: boolean;
  };

  terms: {
    paymentTerms: number; // Días de pago
    creditLimit: number;
    currency: string;
    discountPercentage?: number;
    latePaymentFee?: number;
  };

  banking: {
    bankName?: string;
    accountNumber?: string;
    accountType?: "checking" | "savings";
    routingNumber?: string;
    swiftCode?: string;
  };

  status: "active" | "inactive" | "suspended" | "blacklisted";
  rating: number; // 1-5
  notes?: string;
}
```

### 📦 **Modelo Product (Actualizado):**

```typescript
interface IProduct {
  // ... campos existentes ...

  suppliers: Array<{
    supplierId: string; // Referencia al proveedor
    supplierName: string;
    costPrice: number; // Costo específico
    minimumOrder: number; // Pedido mínimo
    leadTime: number; // Tiempo de entrega en días
    isPreferred: boolean; // Proveedor preferido
    isActive: boolean;
    lastPurchaseDate?: Date;
    lastPurchasePrice?: number;
    notes?: string;
  }>;

  primarySupplier: {
    supplierId: string;
    supplierName: string;
    costPrice: number;
  };
}
```

### 💰 **Modelo AccountsPayable:**

```typescript
interface IAccountsPayable {
  businessId: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;

  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;

  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;

  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  paymentTerms: number;

  paymentMethod?: "cash" | "transfer" | "check" | "credit";
  paymentReference?: string;
  paymentDate?: Date;

  items: Array<{
    productId?: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }>;

  attachments: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
}
```

### 📋 **Modelo PurchaseOrder:**

```typescript
interface IPurchaseOrder {
  businessId: string;
  orderNumber: string; // Número único
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;

  supplierId: string;
  supplierName: string;
  supplierCode: string;

  status:
    | "draft"
    | "sent"
    | "confirmed"
    | "partial"
    | "completed"
    | "cancelled";

  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;

  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    quantityReceived: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;

  delivery: {
    method: "pickup" | "delivery";
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    specialInstructions?: string;
  };

  terms: {
    paymentTerms: number;
    deliveryTerms: string;
    warranty?: string;
    returnPolicy?: string;
  };
}
```

## 🔧 **API Endpoints**

### 🏭 **Gestión de Proveedores:**

#### **Crear Proveedor**

```http
POST /suppliers
Content-Type: application/json

{
  "name": "Distribuidora de Productos de Belleza S.A.S.",
  "type": "distributor",
  "contact": {
    "primaryContact": "María González",
    "email": "ventas@distribuidorabelleza.com",
    "phone": "+57 1 234 5678",
    "mobile": "+57 300 123 4567",
    "website": "www.distribuidorabelleza.com"
  },
  "address": {
    "street": "Calle 123 #45-67",
    "city": "Bogotá",
    "state": "Cundinamarca",
    "zipCode": "110111",
    "country": "Colombia"
  },
  "taxInfo": {
    "taxId": "900123456-1",
    "taxName": "Distribuidora de Productos de Belleza S.A.S.",
    "taxExempt": false
  },
  "terms": {
    "paymentTerms": 30,
    "creditLimit": 5000000,
    "currency": "COP",
    "discountPercentage": 5,
    "latePaymentFee": 2
  },
  "banking": {
    "bankName": "Banco de Bogotá",
    "accountNumber": "1234567890",
    "accountType": "checking"
  },
  "notes": "Proveedor confiable con productos de calidad"
}
```

#### **Obtener Proveedores**

```http
GET /suppliers?businessId=123&status=active&type=distributor&page=1&limit=10&search=distribuidora
```

#### **Obtener Proveedor por ID**

```http
GET /suppliers/{supplierId}
```

#### **Actualizar Proveedor**

```http
PUT /suppliers/{supplierId}
Content-Type: application/json

{
  "rating": 5,
  "notes": "Excelente proveedor, entrega puntual"
}
```

#### **Obtener Productos del Proveedor**

```http
GET /suppliers/{supplierId}/products
```

#### **Obtener Resumen del Proveedor**

```http
GET /suppliers/{supplierId}/summary
```

#### **Suspender Proveedor**

```http
PUT /suppliers/{supplierId}/suspend
Content-Type: application/json

{
  "reason": "Problemas de calidad en productos"
}
```

#### **Reactivar Proveedor**

```http
PUT /suppliers/{supplierId}/activate
```

### 💰 **Gestión de Cuentas por Pagar:**

#### **Crear Cuenta por Pagar**

```http
POST /accounts-payable
Content-Type: application/json

{
  "supplierId": "supplierObjectId",
  "invoiceNumber": "FACT-2024-001",
  "invoiceDate": "2024-09-01",
  "dueDate": "2024-10-01",
  "subtotal": 500000,
  "taxAmount": 95000,
  "discountAmount": 25000,
  "totalAmount": 570000,
  "paymentTerms": 30,
  "items": [
    {
      "productName": "Shampoo Profesional",
      "description": "Shampoo para cabello dañado 500ml",
      "quantity": 20,
      "unitPrice": 25000,
      "totalPrice": 500000,
      "category": "Productos de cuidado"
    }
  ],
  "notes": "Factura por compra de productos de cuidado"
}
```

#### **Procesar Pago**

```http
POST /accounts-payable/{invoiceId}/pay
Content-Type: application/json

{
  "amount": 300000,
  "paymentMethod": "transfer",
  "paymentReference": "TRF-2024-001"
}
```

#### **Obtener Facturas Vencidas**

```http
GET /accounts-payable/overdue?businessId=123
```

### 📋 **Gestión de Órdenes de Compra:**

#### **Crear Orden de Compra**

```http
POST /purchase-orders
Content-Type: application/json

{
  "supplierId": "supplierObjectId",
  "expectedDeliveryDate": "2024-09-15",
  "items": [
    {
      "productId": "productObjectId",
      "quantity": 15,
      "unitPrice": 20000,
      "notes": "Producto para stock"
    }
  ],
  "delivery": {
    "method": "delivery",
    "address": "Calle 100 #15-20, Bogotá",
    "contactPerson": "Ana García",
    "contactPhone": "+57 300 123 4567"
  },
  "terms": {
    "paymentTerms": 30,
    "deliveryTerms": "FOB"
  }
}
```

#### **Aprobar Orden de Compra**

```http
POST /purchase-orders/{orderId}/approve
```

#### **Confirmar Orden**

```http
POST /purchase-orders/{orderId}/confirm
```

#### **Recibir Productos**

```http
POST /purchase-orders/{orderId}/receive
Content-Type: application/json

{
  "itemsReceived": [
    {
      "productId": "productObjectId",
      "quantity": 15
    }
  ]
}
```

## 💡 **Casos de Uso**

### 🏭 **Para Administradores:**

- **Gestionar proveedores** con información completa
- **Configurar costos** por proveedor en productos
- **Aprobar órdenes** de compra
- **Procesar pagos** a proveedores
- **Monitorear cuentas** por pagar

### 📦 **Para Gerentes de Inventario:**

- **Comparar costos** entre proveedores
- **Crear órdenes** de compra
- **Seguir entregas** de productos
- **Gestionar stock** con múltiples proveedores

### 💰 **Para Contadores:**

- **Registrar facturas** de proveedores
- **Procesar pagos** con referencias
- **Generar reportes** de cuentas por pagar
- **Controlar vencimientos**

## 🔐 **Permisos y Roles**

### 👥 **Permisos por Rol:**

| Acción                      | Super Admin | Admin | Manager | Cashier | Expert | Viewer |
| --------------------------- | ----------- | ----- | ------- | ------- | ------ | ------ |
| **Ver proveedores**         | ✅          | ✅    | ✅      | ❌      | ❌     | ✅     |
| **Crear proveedores**       | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Actualizar proveedores**  | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Eliminar proveedores**    | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Ver cuentas por pagar**   | ✅          | ✅    | ✅      | ❌      | ❌     | ✅     |
| **Crear cuentas por pagar** | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Procesar pagos**          | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Ver órdenes de compra**   | ✅          | ✅    | ✅      | ❌      | ❌     | ✅     |
| **Crear órdenes de compra** | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Aprobar órdenes**         | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |

## 📊 **Reportes y Analytics**

### 📈 **Resúmenes por Proveedor:**

- **Total de facturas** y montos
- **Saldo pendiente** y vencido
- **Órdenes de compra** completadas y pendientes
- **Calificación** y rendimiento

### 📋 **Reportes Generales:**

- **Cuentas por pagar** por vencimiento
- **Proveedores** por tipo y estado
- **Órdenes de compra** por estado
- **Análisis de costos** por proveedor

### 🎯 **Métricas Clave:**

- **Tiempo promedio** de pago
- **Proveedores** más utilizados
- **Costos promedio** por categoría
- **Eficiencia** de entregas

## 🧪 **Testing y Validación**

### ✅ **Scripts de Prueba Incluidos:**

- **test-supplier-system.js** - Pruebas completas del sistema

### 🎯 **Escenarios Probados:**

1. **Creación de proveedores** con información completa
2. **Actualización de productos** con múltiples proveedores
3. **Creación de cuentas** por pagar
4. **Procesamiento de pagos** parciales
5. **Creación de órdenes** de compra
6. **Aprobación de órdenes**
7. **Generación de resúmenes**

## 🚀 **Beneficios del Sistema**

### ✅ **Para el Negocio:**

- **Optimización de costos** con múltiples proveedores
- **Control total** de cuentas por pagar
- **Flujo de aprobación** para órdenes de compra
- **Trazabilidad completa** de compras

### ✅ **Para los Proveedores:**

- **Gestión centralizada** de información
- **Términos comerciales** claros
- **Seguimiento de pagos** en tiempo real
- **Comunicación eficiente**

### ✅ **Para el Personal:**

- **Comparación fácil** de costos
- **Procesamiento automático** de pagos
- **Alertas de vencimiento**
- **Reportes detallados**

## 🔧 **Configuración y Uso**

### 1️⃣ **Configurar Proveedor:**

```javascript
const supplier = await Supplier.create({
  businessId: businessId,
  name: "Distribuidora de Productos",
  type: "distributor",
  contact: {
    primaryContact: "María González",
    email: "ventas@distribuidora.com",
    phone: "+57 1 234 5678",
  },
  terms: {
    paymentTerms: 30,
    creditLimit: 5000000,
    currency: "COP",
  },
});
```

### 2️⃣ **Agregar Proveedor a Producto:**

```javascript
const product = await Product.findById(productId);
product.suppliers.push({
  supplierId: supplierId,
  supplierName: "Distribuidora de Productos",
  costPrice: 15000,
  minimumOrder: 10,
  leadTime: 7,
  isPreferred: true,
  isActive: true,
});
await product.save();
```

### 3️⃣ **Crear Cuenta por Pagar:**

```javascript
const accountPayable = await AccountsPayable.create({
  businessId: businessId,
  supplierId: supplierId,
  invoiceNumber: "FACT-2024-001",
  invoiceDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  totalAmount: 570000,
  items: [
    /* items */
  ],
});
```

## 🚀 **Estado del Sistema**

**¡EL SISTEMA DE PROVEEDORES ESTÁ COMPLETAMENTE FUNCIONAL!**

- ✅ **Modelo Supplier** con información completa
- ✅ **Modelo Product** actualizado con múltiples proveedores
- ✅ **Modelo AccountsPayable** para cuentas por pagar
- ✅ **Modelo PurchaseOrder** para órdenes de compra
- ✅ **Controladores completos** con todas las operaciones
- ✅ **Rutas protegidas** con permisos
- ✅ **Validaciones robustas** implementadas
- ✅ **Testing completo** realizado
- ✅ **Documentación detallada** disponible

**¡El sistema está listo para manejar proveedores, cuentas por pagar y órdenes de compra de manera completa y eficiente!** 🏭💰📋
