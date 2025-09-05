# 💰 Sistema de Nómina Completo

## 📋 **Descripción General**

El sistema de nómina está diseñado para gestionar el pago de salarios a usuarios (empleados) que no son clientes ni expertos. Incluye cálculo automático de salarios, bonificaciones, subsidios, retenciones y integración completa con el balance de caja.

## 🎯 **Características Principales**

### ✅ **Configuración Salarial por Empleado:**

- **Tipos de salario:** Mensual, por hora, por día
- **Subsidio de transporte** configurable
- **Tasa de horas extras** personalizable
- **Retenciones:** Impuestos, seguridad social, salud
- **Información laboral:** Cargo, departamento, fecha de contratación

### ✅ **Cálculo Automático de Nómina:**

- **Salario base** según tipo configurado
- **Bonificaciones** adicionales
- **Subsidio de transporte** automático
- **Subsidio por horas extras** calculado automáticamente
- **Retenciones** de impuestos y seguridad social
- **Salario neto** calculado automáticamente

### ✅ **Múltiples Métodos de Pago:**

- **Efectivo** - Integrado con balance de caja
- **Transferencia** - Con referencia de pago
- **Cheque** - Con número de cheque

### ✅ **Estados de Nómina:**

- **Draft** - Borrador, editable
- **Approved** - Aprobada, lista para pago
- **Paid** - Pagada, no editable
- **Cancelled** - Cancelada

### ✅ **Integración con Balance de Caja:**

- **Verificación de saldo** para pagos en efectivo
- **Transacciones automáticas** de caja
- **Actualización de balance** al pagar nóminas

## 🏗️ **Arquitectura del Sistema**

### 📊 **Modelo Payroll:**

```typescript
interface IPayroll {
  employeeId: string; // Referencia a Person (user)
  businessId: string; // ID del negocio
  period: IPayrollPeriod; // Período de nómina
  items: IPayrollItem[]; // Items de nómina
  calculation: IPayrollCalculation; // Cálculos automáticos
  status: "draft" | "approved" | "paid" | "cancelled";
  paymentMethod: "cash" | "transfer" | "check";
  paymentDate?: Date;
  paymentReference?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  paidBy?: string;
  paidAt?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 👤 **Configuración Salarial en Person:**

```typescript
salarySettings: {
  salaryType: "monthly" | "hourly" | "daily";
  monthlySalary: number;
  hourlyRate: number;
  dailyRate: number;
  transportSubsidy: number;
  overtimeRate: number;
  withholdings: {
    taxWithholding: boolean;
    taxRate: number;
    socialSecurity: boolean;
    socialSecurityRate: number;
    healthInsurance: boolean;
    healthInsuranceRate: number;
  }
  position: string;
  department: string;
  hireDate: Date;
  contractType: "full_time" | "part_time" | "contract" | "intern";
}
```

## 🔧 **API Endpoints**

### 📋 **Gestión de Nóminas:**

#### **Obtener Todas las Nóminas**

```http
GET /payroll?businessId=123&employeeId=456&status=approved&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
```

#### **Obtener Nómina por ID**

```http
GET /payroll/{payrollId}
```

#### **Crear Nueva Nómina**

```http
POST /payroll
Content-Type: application/json

{
  "employeeId": "employeeObjectId",
  "period": {
    "startDate": "2024-09-01",
    "endDate": "2024-09-30",
    "periodType": "monthly",
    "workingDays": 22,
    "totalHours": 176,
    "overtimeHours": 8
  },
  "items": [
    {
      "type": "bonus",
      "description": "Bonificación por cumplimiento de metas",
      "amount": 200000,
      "taxable": true,
      "category": "earnings"
    },
    {
      "type": "deduction",
      "description": "Descuento por préstamo",
      "amount": 100000,
      "taxable": false,
      "category": "deductions"
    }
  ],
  "paymentMethod": "transfer",
  "notes": "Nómina mensual de septiembre 2024"
}
```

#### **Actualizar Nómina**

```http
PUT /payroll/{payrollId}
Content-Type: application/json

{
  "items": [...],
  "notes": "Nómina actualizada"
}
```

#### **Aprobar Nómina**

```http
POST /payroll/{payrollId}/approve
```

#### **Pagar Nómina**

```http
POST /payroll/{payrollId}/pay
Content-Type: application/json

{
  "paymentReference": "TRF-123456789"
}
```

#### **Cancelar Nómina**

```http
POST /payroll/{payrollId}/cancel
Content-Type: application/json

{
  "reason": "Error en cálculo"
}
```

#### **Recalcular Nómina**

```http
POST /payroll/{payrollId}/recalculate
```

### 📊 **Reportes y Resúmenes:**

#### **Obtener Resumen de Nómina por Período**

```http
GET /payroll/summary?startDate=2024-09-01&endDate=2024-09-30
```

#### **Obtener Empleados Elegibles**

```http
GET /payroll/eligible-employees
```

## 💰 **Cálculo de Nómina**

### 🧮 **Fórmulas de Cálculo:**

#### **Salario Base:**

- **Mensual:** `monthlySalary`
- **Por Hora:** `hourlyRate × totalHours`
- **Por Día:** `dailyRate × workingDays`

#### **Subsidio por Horas Extras:**

```
overtimeSubsidy = hourlyRate × overtimeHours × overtimeRate
```

#### **Total de Ingresos:**

```
totalEarnings = baseSalary + bonuses + transportSubsidy + overtimeSubsidy
```

#### **Retenciones:**

```
taxWithholding = totalEarnings × taxRate
socialSecurity = totalEarnings × socialSecurityRate
healthInsurance = totalEarnings × healthInsuranceRate
```

#### **Salario Neto:**

```
netPay = totalEarnings - deductions - taxWithholding - socialSecurity - healthInsurance
```

### 📋 **Ejemplo de Cálculo:**

**Empleado con:**

- Salario mensual: $2,000,000
- Bonificación: $200,000
- Subsidio transporte: $140,000
- Horas extras: 8 horas × $10,000 × 1.5 = $120,000
- Descuento: $100,000

**Cálculo:**

- Total ingresos: $2,460,000
- Retención impuestos (10%): $246,000
- Seguridad social (4%): $98,400
- Salud (4%): $98,400
- **Salario neto: $1,917,200**

## 🔐 **Permisos y Roles**

### 👥 **Permisos por Rol:**

| Acción                 | Super Admin | Admin | Manager | Cashier | Expert | Viewer |
| ---------------------- | ----------- | ----- | ------- | ------- | ------ | ------ |
| **Ver nóminas**        | ✅          | ✅    | ✅      | ✅      | ❌     | ✅     |
| **Crear nóminas**      | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Actualizar nóminas** | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Aprobar nóminas**    | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Pagar nóminas**      | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Ver resúmenes**      | ✅          | ✅    | ✅      | ✅      | ❌     | ✅     |

### 🛡️ **Validaciones de Seguridad:**

- **Verificación de empleados** activos y del tipo correcto
- **Validación de configuración salarial** antes de crear nómina
- **Verificación de saldo** en caja para pagos en efectivo
- **Control de estados** para evitar modificaciones no permitidas
- **Auditoría completa** de aprobaciones y pagos

## 💵 **Integración con Balance de Caja**

### 🔄 **Flujo de Pago en Efectivo:**

1. **Verificar balance de caja** abierto
2. **Validar saldo suficiente** para el pago
3. **Marcar nómina como pagada**
4. **Crear transacción de caja** automáticamente
5. **Actualizar balance** de caja

### 📊 **Transacción de Caja:**

```typescript
{
  type: 'payroll_payment',
  amount: netPay,
  description: 'Pago de nómina - [Nombre Empleado]',
  paymentMethod: 'cash',
  reference: 'PAYROLL-[payrollId]'
}
```

## 📈 **Reportes y Analytics**

### 📊 **Resumen de Nómina:**

- **Total empleados** pagados
- **Total salarios brutos**
- **Total deducciones**
- **Total salarios netos**
- **Total retenciones** por tipo
- **Total bonificaciones**
- **Total subsidios** por tipo

### 📋 **Filtros Disponibles:**

- **Por empleado** específico
- **Por período** de tiempo
- **Por estado** de nómina
- **Por método de pago**
- **Por negocio** (multi-tenancy)

## 🧪 **Testing y Validación**

### ✅ **Scripts de Prueba Incluidos:**

- **test-payroll-system.js** - Pruebas completas del sistema

### 🎯 **Escenarios Probados:**

1. **Creación de empleado** con configuración salarial
2. **Creación de nómina** con cálculo automático
3. **Aprobación de nómina**
4. **Pago por transferencia**
5. **Pago en efectivo** con transacción de caja
6. **Generación de resúmenes**

## 🚀 **Casos de Uso**

### 💼 **Para Administradores:**

- **Configurar empleados** con información salarial
- **Crear nóminas** mensuales, quincenales o semanales
- **Aprobar nóminas** antes del pago
- **Generar reportes** de nómina
- **Controlar presupuesto** de nómina

### 💰 **Para Cajeros:**

- **Ver nóminas** aprobadas
- **Procesar pagos** en efectivo
- **Verificar saldo** de caja
- **Registrar transacciones** automáticamente

### 👥 **Para Empleados:**

- **Ver su información** salarial
- **Consultar nóminas** pagadas
- **Verificar deducciones** y retenciones

## 🔧 **Configuración Inicial**

### 1️⃣ **Configurar Empleado:**

```javascript
const employee = await Person.findByIdAndUpdate(employeeId, {
  "userInfo.salarySettings": {
    salaryType: "monthly",
    monthlySalary: 2000000,
    transportSubsidy: 140000,
    overtimeRate: 1.5,
    withholdings: {
      taxWithholding: true,
      taxRate: 0.1,
      socialSecurity: true,
      socialSecurityRate: 0.04,
      healthInsurance: true,
      healthInsuranceRate: 0.04,
    },
    position: "Cajera",
    department: "Atención al Cliente",
    hireDate: new Date(),
    contractType: "full_time",
  },
});
```

### 2️⃣ **Crear Nómina:**

```javascript
const payroll = await Payroll.create({
  employeeId: employeeId,
  businessId: businessId,
  period: {
    startDate: new Date("2024-09-01"),
    endDate: new Date("2024-09-30"),
    periodType: "monthly",
    workingDays: 22,
    totalHours: 176,
    overtimeHours: 8,
  },
  items: [
    {
      type: "bonus",
      description: "Bonificación por metas",
      amount: 200000,
      taxable: true,
      category: "earnings",
    },
  ],
  paymentMethod: "transfer",
  createdBy: userId,
});
```

## 🎯 **Beneficios del Sistema**

### ✅ **Para el Negocio:**

- **Cálculo automático** de nóminas
- **Control de costos** laborales
- **Integración con caja** para pagos en efectivo
- **Reportes detallados** de nómina
- **Cumplimiento legal** con retenciones

### ✅ **Para los Empleados:**

- **Transparencia** en el cálculo salarial
- **Acceso a información** de nómina
- **Pagos puntuales** y organizados
- **Desglose detallado** de deducciones

### ✅ **Para los Administradores:**

- **Gestión centralizada** de nóminas
- **Control de aprobaciones** y pagos
- **Reportes financieros** completos
- **Integración con otros sistemas**

## 🚀 **Estado del Sistema**

**¡EL SISTEMA DE NÓMINA ESTÁ COMPLETAMENTE FUNCIONAL!**

- ✅ **Modelo Payroll** implementado
- ✅ **Controlador completo** con todas las operaciones
- ✅ **Rutas protegidas** con permisos
- ✅ **Integración con balance de caja**
- ✅ **Cálculo automático** de nóminas
- ✅ **Múltiples métodos de pago**
- ✅ **Estados y flujo de trabajo**
- ✅ **Reportes y resúmenes**
- ✅ **Testing completo**

**¡El sistema está listo para gestionar todas las nóminas del salón con cálculo automático, integración con caja y control completo de pagos!** 🎉💰👥
