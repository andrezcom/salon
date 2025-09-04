# 👥 Sistema Unificado de Personas

## 📋 Descripción

Sistema unificado que consolida **Usuarios**, **Expertos** y **Clientes** en un solo modelo `Person`, eliminando duplicación de datos y proporcionando una gestión centralizada de todas las personas en el sistema.

## 🎯 **PROBLEMA RESUELTO**

### ❌ **Antes (Modelos Separados):**

- **User:** `nameUser`, `email`, `profile.phone`, `profile.profileImage`
- **Expert:** `nameExpert`, `email`, `phone`, `profileImage`
- **Client:** `nameClient`, `email`, `phone1`, `phone2` (sin imagen)

### ✅ **Después (Modelo Unificado):**

- **Person:** `firstName`, `lastName`, `email`, `phone`, `phone2`, `profileImage`
- **Tipos específicos:** `userInfo`, `expertInfo`, `clientInfo`
- **Información común:** Dirección, imagen de perfil, estado activo

## 🚀 **BENEFICIOS DE LA UNIFICACIÓN**

### ✅ **Eliminación de Duplicación:**

- **Un solo modelo** para todas las personas
- **Campos comunes** unificados (nombre, email, teléfono, imagen)
- **Información específica** por tipo en sub-objetos

### ✅ **Gestión Simplificada:**

- **API unificada** para todos los tipos de persona
- **CRUD único** con lógica específica por tipo
- **Imágenes de perfil** para todos los tipos

### ✅ **Escalabilidad:**

- **Fácil agregar** nuevos tipos de persona
- **Información específica** sin afectar otros tipos
- **Consultas eficientes** con índices optimizados

## 🛠️ **ESTRUCTURA DEL MODELO**

### 📊 **Campos Comunes:**

```typescript
interface IPerson {
  // Información básica
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phone2?: string;
  numberId?: string;

  // Tipo de persona
  personType: "user" | "expert" | "client";

  // Información específica por tipo
  userInfo?: UserInfo;
  expertInfo?: ExpertInfo;
  clientInfo?: ClientInfo;

  // Información común
  profileImage?: ProfileImage;
  address?: Address;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 👤 **Información de Usuario:**

```typescript
userInfo?: {
  password: string;
  role: 'super_admin' | 'admin' | 'manager' | 'cashier' | 'expert' | 'viewer';
  permissions?: IPermission[];
  businesses: ObjectId[];
  defaultBusiness?: ObjectId;
  settings?: UserSettings;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
}
```

### 👨‍💼 **Información de Experto:**

```typescript
expertInfo?: {
  alias: string;
  role: {
    stylist: boolean;
    manicure: boolean;
    makeup: boolean;
  };
  commissionSettings: {
    serviceCommission: number;
    retailCommission: number;
    serviceCalculationMethod: 'before_inputs' | 'after_inputs';
    minimumServiceCommission: number;
    maximumServiceCommission?: number;
  };
  businessId?: string;
  hireDate: Date;
  notes?: string;
}
```

### 👤 **Información de Cliente:**

```typescript
clientInfo?: {
  preferences: {
    services: string[];
    communication: 'email' | 'phone' | 'sms';
    language: string;
  };
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit?: Date;
  notes?: string;
}
```

## 🔧 **API ENDPOINTS**

### 📋 **CRUD Básico:**

#### **Obtener Todas las Personas**

```http
GET /api/persons?page=1&limit=10&personType=user&businessId=123&active=true&role=admin&search=Juan
```

**Parámetros de Filtro:**

- `personType`: `user`, `expert`, `client`
- `businessId`: ID del negocio
- `active`: `true`/`false`
- `role`: Rol de usuario
- `search`: Búsqueda por nombre o email

#### **Obtener Persona por ID**

```http
GET /api/persons/{personId}
```

#### **Crear Nueva Persona**

```http
POST /api/persons
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "555-1234",
  "personType": "user",
  "userInfo": {
    "password": "password123",
    "role": "admin",
    "businesses": ["businessId1", "businessId2"]
  }
}
```

#### **Actualizar Persona**

```http
PUT /api/persons/{personId}
Content-Type: application/json

{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García"
}
```

#### **Eliminar Persona (Soft Delete)**

```http
DELETE /api/persons/{personId}
Content-Type: application/json

{
  "reason": "Motivo de eliminación",
  "permanent": false
}
```

#### **Restaurar Persona**

```http
PATCH /api/persons/{personId}/restore
```

### 🖼️ **Gestión de Imágenes:**

#### **Subir Imagen de Perfil**

```http
POST /api/persons/{personId}/profile-image
Content-Type: multipart/form-data

FormData:
- profileImage: File (imagen)
```

#### **Eliminar Imagen de Perfil**

```http
DELETE /api/persons/{personId}/profile-image
```

#### **Obtener Información de Imagen**

```http
GET /api/persons/{personId}/profile-image
```

#### **Servir Imagen**

```http
GET /api/uploads/profile-images/{filename}
```

## 🔐 **PERMISOS Y SEGURIDAD**

### 👤 **Permisos por Rol:**

| Acción                        | Super Admin | Admin | Manager | Cashier | Expert | Viewer |
| ----------------------------- | ----------- | ----- | ------- | ------- | ------ | ------ |
| **Crear personas**            | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Ver todas las personas**    | ✅          | ✅    | ✅      | ✅      | ✅     | ✅     |
| **Ver perfil propio**         | ✅          | ✅    | ✅      | ✅      | ✅     | ✅     |
| **Actualizar perfil propio**  | ✅          | ✅    | ✅      | ✅      | ✅     | ❌     |
| **Actualizar otros perfiles** | ✅          | ✅    | ❌      | ❌      | ❌     | ❌     |
| **Eliminar personas**         | ✅          | ❌    | ❌      | ❌      | ❌     | ❌     |
| **Cambiar roles**             | ✅          | ❌    | ❌      | ❌      | ❌     | ❌     |
| **Subir imágenes**            | ✅          | ✅    | ✅      | ✅      | ✅     | ❌     |

### 🛡️ **Validaciones de Seguridad:**

- **Email único** en todo el sistema
- **Verificación de permisos** por rol
- **Auto-eliminación** no permitida
- **Cambio de roles** solo por super_admin
- **Validación de tipos** de archivo para imágenes
- **Límite de tamaño** de archivos (5MB)

## 📊 **MIGRACIÓN DE DATOS**

### 🚀 **Script de Migración:**

```bash
node migrate-to-unified-person.js
```

### 📋 **Proceso de Migración:**

1. **Leer datos** de modelos existentes (User, Expert, Client)
2. **Convertir estructura** al nuevo modelo Person
3. **Migrar información específica** a sub-objetos
4. **Crear backups** de modelos antiguos
5. **Verificar integridad** de datos migrados

### 🔄 **Mapeo de Campos:**

| Modelo Original | Campo Original         | Modelo Nuevo | Campo Nuevo             |
| --------------- | ---------------------- | ------------ | ----------------------- |
| **User**        | `nameUser`             | **Person**   | `firstName`, `lastName` |
| **User**        | `profile.phone`        | **Person**   | `phone`                 |
| **User**        | `profile.profileImage` | **Person**   | `profileImage`          |
| **Expert**      | `nameExpert`           | **Person**   | `firstName`, `lastName` |
| **Expert**      | `phone`                | **Person**   | `phone`                 |
| **Expert**      | `profileImage`         | **Person**   | `profileImage`          |
| **Client**      | `nameClient`           | **Person**   | `firstName`, `lastName` |
| **Client**      | `phone1`               | **Person**   | `phone`                 |
| **Client**      | `phone2`               | **Person**   | `phone2`                |

## 🧪 **PRUEBAS**

### 🚀 **Ejecutar Pruebas:**

```bash
node test-unified-person-system.js
```

### 📋 **Escenarios de Prueba:**

1. ✅ **Creación de personas** (usuarios, expertos, clientes)
2. ✅ **Subida de imágenes** de perfil
3. ✅ **CRUD completo** de personas
4. ✅ **Filtrado por tipo** de persona
5. ✅ **Actualización** de datos
6. ✅ **Eliminación** de personas
7. ✅ **Servicio de imágenes**

## 💡 **EJEMPLOS DE USO**

### 📤 **Crear Usuario:**

```javascript
const userData = {
  firstName: "Juan",
  lastName: "Pérez",
  email: "juan@example.com",
  phone: "555-1234",
  personType: "user",
  userInfo: {
    password: "password123",
    role: "admin",
    businesses: ["businessId1"],
    settings: {
      language: "es",
      timezone: "America/Mexico_City",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
};

const response = await fetch("/api/persons", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(userData),
});
```

### 📤 **Crear Experto:**

```javascript
const expertData = {
  firstName: "María",
  lastName: "García",
  email: "maria@example.com",
  phone: "555-5678",
  personType: "expert",
  expertInfo: {
    alias: "María Estilista",
    role: {
      stylist: true,
      manicure: false,
      makeup: true,
    },
    commissionSettings: {
      serviceCommission: 15,
      retailCommission: 10,
      serviceCalculationMethod: "before_inputs",
      minimumServiceCommission: 50,
    },
    businessId: "businessId1",
    hireDate: new Date(),
    notes: "Experta en estilismo y maquillaje",
  },
};

const response = await fetch("/api/persons", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(expertData),
});
```

### 📤 **Crear Cliente:**

```javascript
const clientData = {
  firstName: "Carlos",
  lastName: "López",
  email: "carlos@example.com",
  phone: "555-9012",
  phone2: "555-3456",
  numberId: "12345678",
  personType: "client",
  clientInfo: {
    preferences: {
      services: ["corte", "peinado"],
      communication: "email",
      language: "es",
    },
    loyaltyPoints: 100,
    totalSpent: 500,
    notes: "Cliente frecuente",
  },
  address: {
    street: "Calle Principal 123",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "01000",
    country: "México",
  },
};

const response = await fetch("/api/persons", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(clientData),
});
```

### 🖼️ **Subir Imagen de Perfil:**

```javascript
const formData = new FormData();
formData.append("profileImage", file);

const response = await fetch(`/api/persons/${personId}/profile-image`, {
  method: "POST",
  body: formData,
});
```

### 🔍 **Buscar Personas:**

```javascript
// Buscar por tipo
const users = await fetch("/api/persons?personType=user");

// Buscar por texto
const search = await fetch("/api/persons?search=Juan");

// Buscar por negocio
const business = await fetch("/api/persons?businessId=businessId1");

// Combinar filtros
const filtered = await fetch(
  "/api/persons?personType=expert&active=true&search=María"
);
```

## 📈 **VENTAJAS DEL SISTEMA UNIFICADO**

### ✅ **Para el Desarrollo:**

- **Código más limpio** y mantenible
- **API unificada** para todos los tipos
- **Menos duplicación** de lógica
- **Fácil agregar** nuevos tipos de persona

### ✅ **Para la Base de Datos:**

- **Menos colecciones** que mantener
- **Consultas más eficientes** con índices optimizados
- **Integridad referencial** mejorada
- **Backup y restauración** simplificados

### ✅ **Para el Usuario:**

- **Experiencia consistente** en toda la aplicación
- **Imágenes de perfil** para todos los tipos
- **Información unificada** y completa
- **Búsqueda global** de personas

### ✅ **Para el Negocio:**

- **Gestión centralizada** de personas
- **Reportes unificados** y completos
- **Escalabilidad** mejorada
- **Mantenimiento** simplificado

## 🎯 **CASOS DE USO**

### 👥 **Gestión de Personal:**

- **Crear usuarios** con diferentes roles
- **Gestionar expertos** con comisiones
- **Asignar permisos** granulares
- **Control de acceso** por negocio

### 👤 **Gestión de Clientes:**

- **Registro de clientes** con preferencias
- **Sistema de lealtad** con puntos
- **Historial de visitas** y gastos
- **Comunicación personalizada**

### 🖼️ **Imágenes de Perfil:**

- **Fotos de perfil** para todos los tipos
- **Identificación visual** fácil
- **Experiencia personalizada**
- **Interfaz más atractiva**

## 🚀 **ESTADO DEL SISTEMA**

**✅ COMPLETAMENTE IMPLEMENTADO Y LISTO PARA PRODUCCIÓN**

El sistema unificado de personas está completamente funcional y proporciona:

- **Modelo unificado** Person para todos los tipos
- **API completa** con CRUD y gestión de imágenes
- **Migración automática** de datos existentes
- **Permisos granulares** por rol
- **Validaciones robustas** de seguridad
- **Pruebas exhaustivas** incluidas

**¡El sistema unificado está listo para simplificar la gestión de todas las personas en el sistema!** 🚀👥
