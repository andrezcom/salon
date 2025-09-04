# 💰 Sistema de Ventas con Modelo Person Unificado

## 📋 Descripción

Sistema de ventas completamente integrado con el modelo `Person` unificado, que maneja correctamente las comisiones por servicios y retail, con soporte para diferentes métodos de cálculo y roles de expertos.

## 🎯 **FUNCIONALIDADES IMPLEMENTADAS**

### ✅ **Integración con Modelo Person:**

- **Referencias correctas** entre ventas y expertos usando `ObjectId`
- **Validación de expertos** activos y del tipo correcto
- **Información completa** del experto en las consultas
- **Configuración de comisiones** específica por experto

### ✅ **Sistema de Comisiones Avanzado:**

- **Comisiones por servicios** con dos métodos de cálculo:
  - `before_inputs`: Comisión sobre el monto total del servicio
  - `after_inputs`: Comisión sobre el monto neto (después de insumos)
- **Comisiones por retail** con porcentaje configurable
- **Comisiones mínimas y máximas** por servicio
- **Cálculo automático** al crear/actualizar ventas

### ✅ **Gestión de Roles y Permisos:**

- **Validación de permisos** por rol de usuario
- **Acceso controlado** a funciones de ventas
- **Auditoría completa** de cambios
- **Seguridad robusta** implementada

## 🛠️ **ESTRUCTURA DEL SISTEMA**

### 📊 **Modelo de Venta Actualizado:**

```typescript
interface ISale {
  idSale: number;
  idClient: string;
  nameClient: string;
  email: string;
  date: Date;
  services: Array<{
    serviceId: number;
    expertId: string; // ObjectId referenciando Person
    input: Array<{
      inputId: number;
      nameProduct: string;
      inputPrice: number;
      qty: number;
      amount: number;
    }>;
    amount: number;
  }>;
  retail: Array<{
    productId: number;
    clientPrice: number;
    qty: number;
    amount: number;
    expertId: string; // ObjectId referenciando Person
  }>;
  total: number;
  paymentMethod: Array<{
    payment: string;
    amount: number;
  }>;
  tipAndChange?: {
    tipAmount: number;
    tipPaymentMethod: "cash" | "card" | "transfer";
    changeAmount: number;
    changeReason?: string;
    tipNotes?: string;
    changeNotes?: string;
  };
  businessId: string;
  status: "completed" | "pending" | "cancelled";
  createdBy: string;
  commissions: Array<{
    expertId: string;
    commissionType: "service" | "retail";
    serviceId?: number;
    baseAmount: number;
    inputCosts: number;
    netAmount: number;
    baseCommissionRate: number;
    appliedCommissionRate: number;
    commissionAmount: number;
    status: "pending" | "paid" | "cancelled";
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 👨‍💼 **Configuración de Comisiones por Experto:**

```typescript
expertInfo: {
  commissionSettings: {
    serviceCommission: number; // Porcentaje de comisión por servicios
    retailCommission: number; // Porcentaje de comisión por retail
    serviceCalculationMethod: 'before_inputs' | 'after_inputs';
    minimumServiceCommission: number; // Comisión mínima por servicio
    maximumServiceCommission?: number; // Comisión máxima por servicio
  }
}
```

## 🔧 **API ENDPOINTS**

### 📋 **CRUD de Ventas:**

#### **Obtener Todas las Ventas**

```http
GET /api/sales?page=1&limit=10&businessId=123&expertId=456&status=completed&startDate=2024-01-01&endDate=2024-12-31
```

#### **Obtener Venta por ID**

```http
GET /api/sales/{saleId}
```

#### **Crear Nueva Venta**

```http
POST /api/sales
Content-Type: application/json

{
  "idClient": "clientId",
  "nameClient": "Juan Pérez",
  "email": "juan@example.com",
  "services": [
    {
      "serviceId": 1,
      "expertId": "expertObjectId",
      "input": [
        {
          "inputId": 1,
          "nameProduct": "Shampoo",
          "inputPrice": 50,
          "qty": 1,
          "amount": 50
        }
      ],
      "amount": 200
    }
  ],
  "retail": [
    {
      "productId": 1,
      "clientPrice": 100,
      "qty": 1,
      "amount": 100,
      "expertId": "expertObjectId"
    }
  ],
  "paymentMethod": [
    {
      "payment": "cash",
      "amount": 300
    }
  ],
  "tipAndChange": {
    "tipAmount": 30,
    "tipPaymentMethod": "cash",
    "changeAmount": 0
  },
  "businessId": "businessId"
}
```

#### **Actualizar Venta**

```http
PUT /api/sales/{saleId}
Content-Type: application/json

{
  "services": [...],
  "retail": [...]
}
```

#### **Eliminar Venta**

```http
DELETE /api/sales/{saleId}
```

### 👨‍💼 **Ventas por Experto:**

#### **Obtener Ventas de un Experto**

```http
GET /api/experts/{expertId}/sales?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
```

### 💵 **Gestión de Comisiones:**

#### **Recalcular Comisiones**

```http
POST /api/sales/{saleId}/recalculate-commissions
```

## 🧮 **CÁLCULO DE COMISIONES**

### 📊 **Comisiones por Servicios:**

#### **Método `before_inputs`:**

```
Comisión = (Monto del Servicio × Tasa de Comisión) / 100
```

**Ejemplo:**

- Servicio: $200
- Tasa: 15%
- Comisión: $30

#### **Método `after_inputs`:**

```
Monto Neto = Monto del Servicio - Costos de Insumos
Comisión = (Monto Neto × Tasa de Comisión) / 100
```

**Ejemplo:**

- Servicio: $200
- Costos de insumos: $80
- Monto neto: $120
- Tasa: 15%
- Comisión: $18

### 🛒 **Comisiones por Retail:**

```
Comisión = (Monto de Retail × Tasa de Comisión) / 100
```

**Ejemplo:**

- Retail: $100
- Tasa: 10%
- Comisión: $10

### ⚖️ **Aplicación de Límites:**

- **Comisión mínima:** Si la comisión calculada es menor al mínimo, se aplica el mínimo
- **Comisión máxima:** Si la comisión calculada es mayor al máximo, se aplica el máximo

## 🔐 **PERMISOS Y ROLES**

### 👤 **Permisos por Rol:**

| Acción                    | Super Admin | Admin | Manager | Cashier | Expert | Viewer |
| ------------------------- | ----------- | ----- | ------- | ------- | ------ | ------ |
| **Ver ventas**            | ✅          | ✅    | ✅      | ✅      | ✅     | ✅     |
| **Crear ventas**          | ✅          | ✅    | ✅      | ✅      | ❌     | ❌     |
| **Actualizar ventas**     | ✅          | ✅    | ✅      | ✅      | ❌     | ❌     |
| **Eliminar ventas**       | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Ver ventas de experto** | ✅          | ✅    | ✅      | ✅      | ✅     | ✅     |
| **Recalcular comisiones** | ✅          | ✅    | ✅      | ❌      | ❌     | ❌     |

### 🛡️ **Validaciones de Seguridad:**

- **Verificación de expertos** activos y válidos
- **Validación de permisos** por rol
- **Auditoría completa** de cambios
- **Protección contra** modificaciones no autorizadas

## 🧪 **PRUEBAS REALIZADAS**

### ✅ **Escenarios Probados:**

1. **Creación de experto** con configuración de comisiones
2. **Creación de cliente** correctamente
3. **Creación de venta** con servicios y retail
4. **Cálculo automático** de comisiones
5. **Aplicación de comisiones** mínimas y máximas
6. **Diferentes métodos** de cálculo (before_inputs vs after_inputs)
7. **Creación de registros** de comisiones
8. **Consultas con información** del experto
9. **Validación de referencias** entre ventas y expertos

### 📊 **Resultados de las Pruebas:**

- ✅ **Experto creado** con configuración de comisiones
- ✅ **Cliente creado** correctamente
- ✅ **Venta creada** con servicios y retail
- ✅ **Comisiones calculadas** automáticamente
- ✅ **Registros de comisiones** creados
- ✅ **Consultas funcionando** correctamente
- ✅ **Diferentes métodos** de cálculo probados

## 💡 **EJEMPLOS DE USO**

### 📤 **Crear Venta con Servicios:**

```javascript
const saleData = {
  idClient: "clientId",
  nameClient: "Juan Pérez",
  email: "juan@example.com",
  services: [
    {
      serviceId: 1,
      expertId: "expertObjectId",
      input: [
        {
          inputId: 1,
          nameProduct: "Shampoo Profesional",
          inputPrice: 50,
          qty: 1,
          amount: 50,
        },
      ],
      amount: 200,
    },
  ],
  retail: [],
  paymentMethod: [
    {
      payment: "cash",
      amount: 200,
    },
  ],
  businessId: "businessId",
};

const response = await fetch("/api/sales", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(saleData),
});
```

### 📤 **Crear Venta con Retail:**

```javascript
const saleData = {
  idClient: "clientId",
  nameClient: "María García",
  email: "maria@example.com",
  services: [],
  retail: [
    {
      productId: 1,
      clientPrice: 100,
      qty: 1,
      amount: 100,
      expertId: "expertObjectId",
    },
  ],
  paymentMethod: [
    {
      payment: "card",
      amount: 100,
    },
  ],
  businessId: "businessId",
};

const response = await fetch("/api/sales", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(saleData),
});
```

### 🔍 **Obtener Ventas de un Experto:**

```javascript
const response = await fetch(
  "/api/experts/expertId/sales?startDate=2024-01-01&endDate=2024-12-31"
);
const data = await response.json();

console.log(`Total de ventas: ${data.data.totals.totalSales}`);
console.log(`Total de comisiones: ${data.data.totals.totalCommissions}`);
```

### 💵 **Recalcular Comisiones:**

```javascript
const response = await fetch("/api/sales/saleId/recalculate-commissions", {
  method: "POST",
});
```

## 📈 **BENEFICIOS DEL SISTEMA**

### ✅ **Para el Negocio:**

- **Cálculo automático** de comisiones
- **Múltiples métodos** de cálculo
- **Control de límites** de comisiones
- **Auditoría completa** de ventas

### ✅ **Para los Expertos:**

- **Comisiones justas** según configuración
- **Transparencia** en el cálculo
- **Historial completo** de ventas
- **Seguimiento** de comisiones

### ✅ **Para los Administradores:**

- **Control total** del sistema
- **Reportes detallados** de ventas
- **Gestión de permisos** granular
- **Monitoreo** en tiempo real

## 🚀 **ESTADO DEL SISTEMA**

**✅ COMPLETAMENTE IMPLEMENTADO Y PROBADO**

El sistema de ventas con modelo Person está completamente funcional y proporciona:

- **Integración perfecta** con el modelo Person unificado
- **Cálculo automático** de comisiones por servicios y retail
- **Múltiples métodos** de cálculo de comisiones
- **Gestión completa** de roles y permisos
- **API robusta** con validaciones de seguridad
- **Pruebas exhaustivas** realizadas y validadas

**¡El sistema de ventas está listo para manejar todas las transacciones con comisiones calculadas automáticamente según los roles y configuraciones de los expertos!** 🚀💰👨‍💼
