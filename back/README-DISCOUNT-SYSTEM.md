# 💰 Sistema de Descuentos en Ventas

## 📋 **Descripción General**

El sistema de descuentos permite aplicar diferentes tipos de descuentos a las ventas, incluyendo descuentos por porcentaje, monto fijo, promocionales, de lealtad, por compra al por mayor y estacionales. El sistema calcula automáticamente los totales y mantiene un historial completo de todos los descuentos aplicados.

## 🎯 **Características Principales**

### ✅ **Tipos de Descuentos Disponibles:**

- **percentage** - Descuento por porcentaje (ej: 15%)
- **fixed_amount** - Descuento por monto fijo (ej: $50)
- **promotional** - Descuento promocional
- **loyalty** - Descuento por programa de lealtad
- **bulk** - Descuento por compra al por mayor
- **seasonal** - Descuento estacional

### ✅ **Cálculo Automático:**

- **Subtotal** - Total antes de descuentos
- **Total de descuentos** - Suma de todos los descuentos aplicados
- **Total final** - Subtotal menos descuentos
- **Porcentaje de ahorro** - Calculado automáticamente

### ✅ **Gestión Completa:**

- **Aplicar descuentos** con validaciones
- **Remover descuentos** individuales
- **Recalcular totales** automáticamente
- **Resúmenes detallados** por venta
- **Estadísticas generales** del negocio

## 🏗️ **Arquitectura del Sistema**

### 📊 **Estructura de Descuentos:**

```typescript
interface IDiscount {
  type:
    | "percentage"
    | "fixed_amount"
    | "promotional"
    | "loyalty"
    | "bulk"
    | "seasonal";
  description: string;
  value: number; // Porcentaje o monto fijo
  appliedAmount: number; // Monto real descontado
  reason?: string; // Razón del descuento
  appliedBy?: string; // ID de quien aplicó el descuento
  appliedAt?: Date; // Fecha de aplicación
}
```

### 📈 **Campos de Venta Actualizados:**

```typescript
interface ISale {
  subtotal: number; // Total antes de descuentos
  discounts: IDiscount[]; // Array de descuentos
  totalDiscounts: number; // Total de descuentos aplicados
  finalTotal: number; // Total final después de descuentos
  total: number; // Compatibilidad (igual a finalTotal)
}
```

## 🔧 **API Endpoints**

### 📋 **Gestión de Descuentos:**

#### **Aplicar Descuento a una Venta**

```http
POST /sales/{saleId}/discounts
Content-Type: application/json

{
  "type": "percentage",
  "value": 15,
  "description": "Descuento por cliente frecuente",
  "reason": "Cliente con más de 10 visitas"
}
```

#### **Remover Descuento de una Venta**

```http
DELETE /sales/{saleId}/discounts/{discountIndex}
```

#### **Obtener Resumen de Descuentos**

```http
GET /sales/{saleId}/discounts/summary
```

#### **Recalcular Totales de una Venta**

```http
POST /sales/{saleId}/recalculate-totals
```

### 📊 **Respuestas de la API:**

#### **Aplicar Descuento - Respuesta:**

```json
{
  "success": true,
  "message": "Descuento aplicado exitosamente",
  "data": {
    "sale": {
      /* venta actualizada */
    },
    "appliedAmount": 94.5,
    "discountSummary": {
      "totalDiscounts": 94.5,
      "discountCount": 1,
      "subtotal": 630,
      "finalTotal": 535.5,
      "savingsPercentage": 15.0,
      "discountsByType": {
        "percentage": { "count": 1, "total": 94.5 }
      }
    }
  }
}
```

#### **Resumen de Descuentos - Respuesta:**

```json
{
  "success": true,
  "message": "Resumen de descuentos obtenido exitosamente",
  "data": {
    "totalDiscounts": 174.5,
    "discountCount": 3,
    "subtotal": 630,
    "finalTotal": 455.5,
    "savingsPercentage": 27.7,
    "discountsByType": {
      "percentage": { "count": 1, "total": 94.5 },
      "fixed_amount": { "count": 1, "total": 50 },
      "promotional": { "count": 1, "total": 30 }
    }
  }
}
```

## 💰 **Lógica de Cálculo**

### 🧮 **Fórmulas de Cálculo:**

#### **Descuento por Porcentaje:**

```
appliedAmount = (subtotal × percentage) / 100
```

#### **Descuento por Monto Fijo:**

```
appliedAmount = min(value, subtotal - totalDiscounts)
```

#### **Total Final:**

```
finalTotal = max(0, subtotal - totalDiscounts)
```

#### **Porcentaje de Ahorro:**

```
savingsPercentage = (totalDiscounts / subtotal) × 100
```

### 📋 **Ejemplo de Cálculo:**

**Venta con:**

- Subtotal: $630
- Descuento 1: 15% = $94.50
- Descuento 2: $50 fijo = $50
- Descuento 3: $30 promocional = $30

**Cálculo:**

- Total descuentos: $174.50
- Total final: $455.50
- Porcentaje de ahorro: 27.70%

## 🎯 **Casos de Uso**

### 💼 **Para Cajeros:**

- **Aplicar descuentos** promocionales
- **Verificar totales** antes y después de descuentos
- **Explicar descuentos** a los clientes
- **Procesar pagos** con totales finales

### 👑 **Para Administradores:**

- **Configurar descuentos** por tipo de cliente
- **Aplicar descuentos** de lealtad
- **Monitorear uso** de descuentos
- **Analizar impacto** en ventas

### 📊 **Para Gerentes:**

- **Ver estadísticas** de descuentos
- **Analizar efectividad** de promociones
- **Controlar costos** de descuentos
- **Optimizar estrategias** de precios

## 🔐 **Validaciones y Seguridad**

### ✅ **Validaciones Implementadas:**

- **Verificación de venta** existente y activa
- **Validación de tipos** de descuento
- **Control de montos** válidos
- **Prevención de descuentos** excesivos
- **Verificación de permisos** por rol

### 🛡️ **Reglas de Negocio:**

- **No se pueden aplicar descuentos** a ventas canceladas
- **Los descuentos no pueden exceder** el subtotal
- **Se mantiene historial** de quién aplicó cada descuento
- **Cálculo automático** de totales al modificar descuentos

## 📈 **Reportes y Analytics**

### 📊 **Resumen por Venta:**

- **Subtotal** original
- **Total de descuentos** aplicados
- **Total final** después de descuentos
- **Porcentaje de ahorro** del cliente
- **Desglose por tipo** de descuento

### 📋 **Estadísticas Generales:**

- **Total de ventas** con descuentos
- **Subtotal total** de todas las ventas
- **Descuentos totales** aplicados
- **Ahorro promedio** por venta
- **Uso por tipo** de descuento

### 🎯 **Métricas Clave:**

- **Tasa de uso** de descuentos
- **Impacto en ventas** totales
- **Efectividad** por tipo de descuento
- **Tendencias** de uso por período

## 🧪 **Testing y Validación**

### ✅ **Scripts de Prueba Incluidos:**

- **test-discount-system.js** - Pruebas completas del sistema

### 🎯 **Escenarios Probados:**

1. **Creación de venta** con servicios y retail
2. **Aplicación de descuento** por porcentaje
3. **Aplicación de descuento** por monto fijo
4. **Aplicación de descuento** promocional
5. **Generación de resúmenes** de descuentos
6. **Creación de ventas** con descuentos de lealtad
7. **Creación de ventas** con descuentos estacionales
8. **Obtención de estadísticas** generales

## 🚀 **Casos de Uso Específicos**

### 🎉 **Descuentos Promocionales:**

```javascript
// Descuento por compra mayor a $500
{
  type: 'promotional',
  value: 30,
  description: 'Descuento por compra mayor a $500',
  reason: 'Promoción de fin de semana'
}
```

### 👑 **Descuentos de Lealtad:**

```javascript
// Descuento para clientes VIP
{
  type: 'loyalty',
  value: 20, // 20%
  description: 'Descuento por programa de lealtad',
  reason: 'Cliente VIP - Nivel Oro'
}
```

### 🎄 **Descuentos Estacionales:**

```javascript
// Descuento navideño
{
  type: 'seasonal',
  value: 25, // 25%
  description: 'Descuento navideño',
  reason: 'Promoción navideña 2024'
}
```

### 📦 **Descuentos por Volumen:**

```javascript
// Descuento por compra al por mayor
{
  type: 'bulk',
  value: 100,
  description: 'Descuento por compra mayorista',
  reason: 'Compra de más de 10 productos'
}
```

## 🔧 **Configuración y Uso**

### 1️⃣ **Aplicar Descuento:**

```javascript
const appliedAmount = sale.applyDiscount(
  "percentage", // tipo
  15, // valor (15%)
  "Descuento por cliente frecuente", // descripción
  userId, // aplicado por
  "Cliente con más de 10 visitas" // razón
);
```

### 2️⃣ **Obtener Resumen:**

```javascript
const summary = sale.getDiscountSummary();
console.log(`Ahorro total: $${summary.totalDiscounts}`);
console.log(`Porcentaje de ahorro: ${summary.savingsPercentage}%`);
```

### 3️⃣ **Recalcular Totales:**

```javascript
sale.recalculateTotals();
await sale.save();
```

## 🎯 **Beneficios del Sistema**

### ✅ **Para el Negocio:**

- **Flexibilidad** en estrategias de precios
- **Control total** sobre descuentos aplicados
- **Análisis detallado** de impacto en ventas
- **Automatización** de cálculos complejos

### ✅ **Para los Clientes:**

- **Transparencia** en descuentos aplicados
- **Múltiples opciones** de ahorro
- **Programas de lealtad** efectivos
- **Promociones** atractivas

### ✅ **Para el Personal:**

- **Fácil aplicación** de descuentos
- **Cálculos automáticos** sin errores
- **Historial completo** de operaciones
- **Reportes detallados** para análisis

## 🚀 **Estado del Sistema**

**¡EL SISTEMA DE DESCUENTOS ESTÁ COMPLETAMENTE FUNCIONAL!**

- ✅ **Modelo Sale actualizado** con campos de descuentos
- ✅ **Métodos de cálculo** automático implementados
- ✅ **Controladores completos** con todas las operaciones
- ✅ **Rutas protegidas** con permisos
- ✅ **Validaciones robustas** implementadas
- ✅ **Testing completo** realizado
- ✅ **Documentación detallada** disponible

**¡El sistema está listo para manejar todos los tipos de descuentos en las ventas con cálculo automático, validaciones y reportes completos!** 🎉💰🛒
