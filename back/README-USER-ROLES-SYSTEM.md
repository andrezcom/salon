# 👥 Sistema de Roles y Permisos para Usuarios

## 📋 Descripción

Sistema completo de gestión de usuarios con roles específicos y permisos granulares para diferentes tipos de usuarios en el sistema de salón.

## 🎯 Roles Implementados

### 🔴 **Super Administrador (super_admin)**

- **Descripción:** Acceso completo al sistema
- **Permisos:** Todos los módulos con todas las acciones
- **Responsabilidades:**
  - Gestión completa de usuarios y roles
  - Acceso a todos los negocios
  - Configuración del sistema
  - Eliminación de usuarios

### 🟠 **Administrador (admin)**

- **Descripción:** Administración del negocio
- **Permisos:** Gestión completa excepto super_admin
- **Responsabilidades:**
  - Crear y gestionar usuarios
  - Administrar expertos y servicios
  - Gestionar inventario y ventas
  - Acceso a reportes

### 🟡 **Gerente (manager)**

- **Descripción:** Gestión operativa
- **Permisos:** Operaciones de gestión sin eliminación
- **Responsabilidades:**
  - Gestionar expertos y servicios
  - Supervisar ventas e inventario
  - Aprobar gastos
  - Ver reportes

### 🟢 **Cajero (cashier)**

- **Descripción:** Manejo de caja y ventas
- **Permisos:** Operaciones de caja y ventas
- **Responsabilidades:**
  - Procesar ventas
  - Manejar transacciones de caja
  - Gestionar propinas y devoluciones
  - Ver reportes de caja

### 🔵 **Experto (expert)**

- **Descripción:** Servicios y comisiones
- **Permisos:** Solo lectura y creación de ventas
- **Responsabilidades:**
  - Realizar servicios
  - Crear ventas
  - Ver sus comisiones
  - Acceso limitado a información

### ⚪ **Visualizador (viewer)**

- **Descripción:** Solo lectura
- **Permisos:** Solo lectura en todos los módulos
- **Responsabilidades:**
  - Ver información del sistema
  - Acceso de solo lectura
  - Sin permisos de modificación

## 🔐 Sistema de Permisos

### 📊 **Módulos Disponibles:**

- **business** - Gestión de negocios
- **users** - Gestión de usuarios
- **experts** - Gestión de expertos
- **sales** - Gestión de ventas
- **inventory** - Gestión de inventario
- **commissions** - Gestión de comisiones
- **cash** - Gestión de caja
- **expenses** - Gestión de gastos
- **reports** - Reportes y análisis
- **settings** - Configuración del sistema

### ⚡ **Acciones Disponibles:**

- **create** - Crear nuevos registros
- **read** - Leer/ver información
- **update** - Actualizar registros existentes
- **delete** - Eliminar registros
- **manage** - Gestión completa (incluye todas las acciones)

## 🛠️ API Endpoints

### 👥 **Gestión de Usuarios**

#### **Obtener Todos los Usuarios**

```http
GET /api/users?page=1&limit=10&role=admin&businessId=123&active=true
Authorization: Bearer {token}
```

#### **Obtener Usuario por ID**

```http
GET /api/users/{userId}
Authorization: Bearer {token}
```

#### **Crear Usuario**

```http
POST /api/users
Content-Type: application/json
Authorization: Bearer {token}

{
  "nameUser": "Juan Pérez",
  "email": "juan@example.com",
  "pass": "password123",
  "role": "cashier",
  "businesses": ["businessId1", "businessId2"],
  "defaultBusiness": "businessId1",
  "profile": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+52 555 123 4567",
    "address": "Calle 123, Colonia Centro",
    "city": "Ciudad de México",
    "country": "México"
  },
  "settings": {
    "language": "es",
    "timezone": "America/Mexico_City",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  }
}
```

#### **Actualizar Usuario**

```http
PUT /api/users/{userId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "profile": {
    "firstName": "Juan Carlos",
    "lastName": "Pérez García",
    "phone": "+52 555 987 6543"
  },
  "settings": {
    "language": "en",
    "timezone": "America/New_York"
  }
}
```

#### **Eliminar Usuario (Soft Delete)**

```http
DELETE /api/users/{userId}
Authorization: Bearer {token}
```

#### **Restaurar Usuario**

```http
PATCH /api/users/{userId}/restore
Authorization: Bearer {token}
```

### 🏢 **Gestión de Negocios**

#### **Asignar Usuario a Negocio**

```http
POST /api/users/{userId}/businesses/{businessId}
Authorization: Bearer {token}
```

#### **Remover Usuario de Negocio**

```http
DELETE /api/users/{userId}/businesses/{businessId}
Authorization: Bearer {token}
```

### 🔐 **Gestión de Roles y Permisos**

#### **Obtener Roles Disponibles**

```http
GET /api/roles/available
Authorization: Bearer {token}
```

#### **Obtener Permisos de un Rol**

```http
GET /api/roles/{role}/permissions
Authorization: Bearer {token}
```

## 🛡️ Middleware de Autorización

### 🔒 **Middleware Disponibles:**

#### **Autenticación Básica**

```typescript
import { requireAuth } from "../middleware/authorization";

router.get("/protected", requireAuth, controller.method);
```

#### **Verificación de Rol**

```typescript
import { requireRole } from "../middleware/authorization";

router.get(
  "/admin-only",
  requireRole("admin", "super_admin"),
  controller.method
);
```

#### **Verificación de Permisos**

```typescript
import { requirePermission } from "../middleware/authorization";

router.post(
  "/create-user",
  requirePermission("users", "create"),
  controller.method
);
```

#### **Verificación de Acceso a Negocio**

```typescript
import { requireBusinessAccess } from "../middleware/authorization";

router.get(
  "/business/:businessId/data",
  requireBusinessAccess(),
  controller.method
);
```

#### **Verificación de Propiedad de Negocio**

```typescript
import { requireBusinessOwnership } from "../middleware/authorization";

router.delete(
  "/business/:businessId",
  requireBusinessOwnership(),
  controller.method
);
```

### 🔧 **Combinaciones Comunes:**

```typescript
import {
  requireAdmin,
  requireManager,
  requireCashier,
} from "../middleware/authorization";

// Solo administradores
router.get("/admin", requireAdmin, controller.method);

// Administradores y gerentes
router.get("/management", requireManager, controller.method);

// Cajeros y superiores
router.get("/cashier", requireCashier, controller.method);
```

## 📊 Matriz de Permisos

| Rol             | Business | Users      | Experts    | Sales      | Inventory  | Commissions | Cash       | Expenses   | Reports | Settings |
| --------------- | -------- | ---------- | ---------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------- | -------- |
| **super_admin** | ✅ All   | ✅ All     | ✅ All     | ✅ All     | ✅ All     | ✅ All      | ✅ All     | ✅ All     | ✅ All  | ✅ All   |
| **admin**       | ✅ R,U   | ✅ C,R,U,D | ✅ C,R,U,D | ✅ C,R,U,D | ✅ C,R,U,D | ✅ C,R,U,D  | ✅ C,R,U,D | ✅ C,R,U,D | ✅ R    | ✅ R,U   |
| **manager**     | ✅ R     | ✅ R       | ✅ C,R,U   | ✅ C,R,U   | ✅ C,R,U   | ✅ R,U      | ✅ R,U     | ✅ C,R,U   | ✅ R    | ✅ R     |
| **cashier**     | ✅ R     | ✅ R       | ✅ R       | ✅ C,R,U   | ✅ R       | ✅ R        | ✅ C,R,U   | ✅ R       | ✅ R    | ✅ R     |
| **expert**      | ✅ R     | ✅ R       | ✅ R       | ✅ C,R     | ✅ R       | ✅ R        | ✅ R       | ✅ R       | ✅ R    | ✅ R     |
| **viewer**      | ✅ R     | ✅ R       | ✅ R       | ✅ R       | ✅ R       | ✅ R        | ✅ R       | ✅ R       | ✅ R    | ✅ R     |

**Leyenda:** C=Create, R=Read, U=Update, D=Delete, All=Todas las acciones

## 🔐 Seguridad Implementada

### ✅ **Medidas de Seguridad:**

- **Autenticación requerida** para todas las operaciones
- **Verificación de roles** antes de permitir acceso
- **Permisos granulares** por módulo y acción
- **Validación de acceso a negocios** específicos
- **Control de propiedad** de negocios
- **Soft delete** para usuarios (no eliminación permanente)
- **Bloqueo de cuentas** después de intentos fallidos
- **Validación de auto-eliminación** (no puedes eliminar tu propia cuenta)

### 🛡️ **Validaciones Especiales:**

- Solo **super_admin** puede crear otros **super_admin**
- Solo **super_admin** puede eliminar usuarios
- Solo **admin** y **super_admin** pueden asignar usuarios a negocios
- Los usuarios solo pueden ver/editar su propio perfil (excepto admins)
- Verificación de **propiedad de negocios** para operaciones críticas

## 💡 Uso en Frontend

### 🔐 **Verificación de Permisos:**

```javascript
// Verificar si el usuario puede crear usuarios
const canCreateUsers = user.hasPermission("users", "create");

// Verificar si el usuario es administrador
const isAdmin = ["admin", "super_admin"].includes(user.role);

// Verificar acceso a un negocio específico
const hasBusinessAccess = user.businesses.includes(businessId);
```

### 🎨 **Mostrar/Ocultar Elementos:**

```javascript
// Mostrar botón de crear usuario solo si tiene permisos
{
  user.hasPermission("users", "create") && (
    <button onClick={createUser}>Crear Usuario</button>
  );
}

// Mostrar menú de administración solo para admins
{
  ["admin", "super_admin"].includes(user.role) && <AdminMenu />;
}
```

### 📊 **Filtrado de Datos:**

```javascript
// Filtrar datos según permisos del usuario
const filteredData = data.filter((item) => {
  if (user.role === "super_admin") return true;
  if (user.role === "admin") return item.businessId === user.defaultBusiness;
  return item.createdBy === user.id;
});
```

## 🧪 Pruebas

### 🚀 **Ejecutar Pruebas:**

```bash
node test-user-roles-system.js
```

### 📋 **Escenarios de Prueba:**

1. ✅ Creación de usuarios con diferentes roles
2. ✅ Verificación de permisos por rol
3. ✅ Pruebas de acceso a endpoints
4. ✅ Gestión de asignación a negocios
5. ✅ Actualización de perfiles de usuario
6. ✅ Eliminación y restauración de usuarios

## 🎯 Beneficios del Sistema

### ✅ **Para el Negocio:**

- **Control granular** de acceso a información
- **Seguridad mejorada** con roles específicos
- **Auditoría completa** de acciones de usuarios
- **Flexibilidad** para diferentes tipos de empleados
- **Escalabilidad** para múltiples negocios

### ✅ **Para los Usuarios:**

- **Interfaz personalizada** según su rol
- **Acceso apropiado** a funciones necesarias
- **Perfiles completos** con información personal
- **Configuraciones personalizadas** (idioma, zona horaria)
- **Notificaciones configurables**

### ✅ **Para los Desarrolladores:**

- **Middleware reutilizable** para autorización
- **API consistente** para gestión de usuarios
- **Validaciones automáticas** de permisos
- **Documentación completa** del sistema
- **Pruebas automatizadas** incluidas

## 🚀 Estado del Sistema

**✅ COMPLETAMENTE IMPLEMENTADO Y LISTO PARA PRODUCCIÓN**

El sistema de roles y permisos está completamente funcional y proporciona:

- **6 roles diferentes** con permisos específicos
- **10 módulos** con acciones granulares
- **API completa** para gestión de usuarios
- **Middleware robusto** para autorización
- **Seguridad avanzada** implementada
- **Pruebas completas** incluidas

**¡El sistema está listo para manejar diferentes tipos de usuarios con permisos específicos!** 🚀👥
