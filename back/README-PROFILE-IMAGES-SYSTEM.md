# 🖼️ Sistema de Imágenes de Perfil para Usuarios y Expertos

## 📋 Descripción

Sistema completo para manejar imágenes de perfil tanto de usuarios como de expertos, incluyendo subida, almacenamiento, servicio y eliminación de imágenes con validaciones de permisos.

## 🚀 Funcionalidades

### ✅ **Operaciones Implementadas:**

- **📤 Subir imagen de perfil** - Para usuarios y expertos con validación de tipos y tamaños
- **🗑️ Eliminar imagen de perfil** - Eliminación física y lógica
- **📋 Obtener información de imagen** - Metadatos completos
- **🖼️ Servir imágenes** - Endpoint para mostrar imágenes
- **🔒 Validación de permisos** - Diferentes niveles de acceso según el rol

### 📊 **Tipos de Archivo Soportados:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### 📏 **Límites:**

- **Tamaño máximo:** 5MB
- **Validación de tipos:** Solo imágenes
- **Nombres únicos:** Generación automática

## 🛠️ API Endpoints

### 👤 **Gestión de Imágenes de Perfil de Usuarios**

#### **Subir Imagen de Perfil de Usuario**

```http
POST /api/users/{userId}/profile-image
Content-Type: multipart/form-data

FormData:
- profileImage: File (imagen)
- userId: string (ID del usuario)
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Imagen de perfil subida exitosamente",
  "data": {
    "user": {
      "id": "userId",
      "nameUser": "Nombre del Usuario",
      "email": "usuario@example.com",
      "profileImage": {
        "url": "/uploads/profile-images/users/filename.png",
        "filename": "users-123-1234567890.png",
        "originalName": "mi-imagen.png",
        "size": 1024,
        "mimeType": "image/png",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

#### **Eliminar Imagen de Perfil de Usuario**

```http
DELETE /api/users/{userId}/profile-image
Content-Type: application/json

{
  "userId": "userId"
}
```

#### **Obtener Información de Imagen de Usuario**

```http
GET /api/users/{userId}/profile-image
```

### 👨‍💼 **Gestión de Imágenes de Perfil de Expertos**

#### **Subir Imagen de Perfil de Experto**

```http
POST /api/experts/{expertId}/profile-image
Content-Type: multipart/form-data

FormData:
- profileImage: File (imagen)
- userId: string (ID del usuario)
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Imagen de perfil subida exitosamente",
  "data": {
    "expert": {
      "id": "expertId",
      "nameExpert": "Nombre del Experto",
      "email": "experto@example.com",
      "profileImage": {
        "url": "/uploads/profile-images/experts/filename.png",
        "filename": "experts-123-1234567890.png",
        "originalName": "mi-imagen.png",
        "size": 1024,
        "mimeType": "image/png",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

#### **Eliminar Imagen de Perfil de Experto**

```http
DELETE /api/experts/{expertId}/profile-image
Content-Type: application/json

{
  "userId": "userId"
}
```

#### **Obtener Información de Imagen de Experto**

```http
GET /api/experts/{expertId}/profile-image
```

### 🖼️ **Servir Imágenes**

```http
GET /api/uploads/profile-images/{entityType}/{filename}
```

**Parámetros:**

- `entityType`: `users` o `experts`
- `filename`: Nombre del archivo de imagen

## 📁 Estructura de Archivos

```
back/
├── src/
│   ├── controllers/
│   │   └── profileImage.ts    # Controlador unificado de imágenes
│   ├── routes/
│   │   └── profileImage.ts    # Rutas de imágenes
│   ├── models/
│   │   ├── user.ts           # Modelo con campo profileImage
│   │   └── expert.ts         # Modelo con campo profileImage
│   └── index.ts              # Servidor con middleware estático
├── uploads/
│   └── profile-images/       # Directorio de imágenes
│       ├── users/            # Imágenes de usuarios
│       └── experts/          # Imágenes de expertos
└── test-profile-images-system.js # Script de pruebas
```

## 🔧 Configuración

### 📦 **Dependencias Instaladas:**

```bash
npm install multer @types/multer
```

### 📁 **Directorio de Uploads:**

```bash
mkdir -p uploads/profile-images/users uploads/profile-images/experts
```

### ⚙️ **Configuración de Multer:**

- **Destino:** `uploads/profile-images/{entityType}/`
- **Nombres únicos:** `{entityType}-{id}-{timestamp}-{random}.{ext}`
- **Límite de tamaño:** 5MB
- **Tipos permitidos:** Solo imágenes

## 🔐 Permisos y Seguridad

### 👤 **Usuarios:**

- **Propio perfil:** Cualquier usuario puede cambiar su propia imagen
- **Otros usuarios:** Solo admin y super_admin pueden cambiar imágenes de otros usuarios

### 👨‍💼 **Expertos:**

- **Solo administradores:** super_admin, admin y manager pueden cambiar imágenes de expertos
- **Verificación de permisos:** Middleware de autorización implementado

### 🛡️ **Validaciones de Seguridad:**

- **Tipos de archivo:** Solo imágenes permitidas
- **Tamaño de archivo:** Máximo 5MB
- **Permisos:** Verificación por rol
- **Nombres únicos:** Previene conflictos
- **Limpieza:** Eliminación de archivos antiguos

## 🧪 Pruebas

### 🚀 **Ejecutar Pruebas:**

```bash
node test-profile-images-system.js
```

### 📋 **Escenarios de Prueba:**

1. ✅ Creación de imagen de prueba
2. ✅ Subida de imagen de perfil de usuario
3. ✅ Subida de imagen de perfil de experto
4. ✅ Obtención de información de imágenes
5. ✅ Servicio de archivos de imagen
6. ✅ Eliminación de imágenes de perfil
7. ✅ CRUD completo de usuarios
8. ✅ CRUD completo de expertos

## 💡 Uso en Frontend

### 📤 **Subir Imagen de Usuario:**

```javascript
const formData = new FormData();
formData.append("profileImage", file);
formData.append("userId", userId);

const response = await fetch(`/api/users/${userId}/profile-image`, {
  method: "POST",
  body: formData,
});
```

### 📤 **Subir Imagen de Experto:**

```javascript
const formData = new FormData();
formData.append("profileImage", file);
formData.append("userId", userId);

const response = await fetch(`/api/experts/${expertId}/profile-image`, {
  method: "POST",
  body: formData,
});
```

### 🖼️ **Mostrar Imagen de Usuario:**

```html
<img
  src="/api/uploads/profile-images/users/filename.png"
  alt="Perfil del usuario"
/>
```

### 🖼️ **Mostrar Imagen de Experto:**

```html
<img
  src="/api/uploads/profile-images/experts/filename.png"
  alt="Perfil del experto"
/>
```

### 🗑️ **Eliminar Imagen:**

```javascript
// Eliminar imagen de usuario
const response = await fetch(`/api/users/${userId}/profile-image`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId }),
});

// Eliminar imagen de experto
const response = await fetch(`/api/experts/${expertId}/profile-image`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId }),
});
```

## 📊 Modelos de Base de Datos

### 👤 **Campo profileImage en User:**

```typescript
profile?: {
  // ... otros campos ...
  profileImage?: {
    url: string;           // URL de acceso a la imagen
    filename: string;      // Nombre del archivo en el servidor
    originalName: string;  // Nombre original del archivo
    size: number;          // Tamaño en bytes
    mimeType: string;      // Tipo MIME (image/png, etc.)
    uploadedAt: Date;      // Fecha de subida
  };
  // ... otros campos ...
}
```

### 👨‍💼 **Campo profileImage en Expert:**

```typescript
profileImage?: {
  url: string;           // URL de acceso a la imagen
  filename: string;      // Nombre del archivo en el servidor
  originalName: string;  // Nombre original del archivo
  size: number;          // Tamaño en bytes
  mimeType: string;      // Tipo MIME (image/png, etc.)
  uploadedAt: Date;      // Fecha de subida
};
```

## 🎯 CRUD Completo

### 👥 **Usuarios - CRUD Completo:**

- ✅ **CREATE** - Crear usuario con imagen de perfil
- ✅ **READ** - Obtener usuario con información de imagen
- ✅ **UPDATE** - Actualizar usuario y su imagen de perfil
- ✅ **DELETE** - Eliminar usuario (soft delete)
- ✅ **RESTORE** - Restaurar usuario eliminado
- ✅ **PROFILE IMAGE** - Gestión completa de imagen de perfil

### 👨‍💼 **Expertos - CRUD Completo:**

- ✅ **CREATE** - Crear experto con imagen de perfil
- ✅ **READ** - Obtener experto con información de imagen
- ✅ **UPDATE** - Actualizar experto y su imagen de perfil
- ✅ **DELETE** - Eliminar experto (soft delete)
- ✅ **RESTORE** - Restaurar experto eliminado
- ✅ **PROFILE IMAGE** - Gestión completa de imagen de perfil

## 🎯 Beneficios

### ✅ **Para el Sistema:**

- **Experiencia visual mejorada** con fotos de perfil
- **Identidad visual** de usuarios y expertos
- **Interfaz más atractiva** y profesional
- **Personalización** de perfiles
- **Reconocimiento visual** fácil

### ✅ **Para los Usuarios:**

- **Perfiles personalizados** con imágenes
- **Fácil identificación** visual
- **Experiencia más humana** del sistema
- **Gestión simple** de imágenes de perfil

### ✅ **Para los Desarrolladores:**

- **API unificada** para usuarios y expertos
- **Validaciones robustas** implementadas
- **Manejo de errores** completo
- **Documentación detallada** incluida
- **Pruebas automatizadas** incluidas

## 🚀 Estado del Sistema

**✅ COMPLETAMENTE IMPLEMENTADO Y LISTO PARA PRODUCCIÓN**

El sistema de imágenes de perfil está completamente funcional y proporciona:

- **Gestión completa** de imágenes para usuarios y expertos
- **API unificada** con endpoints específicos
- **Validaciones de seguridad** robustas
- **Permisos granulares** por rol
- **CRUD completo** para ambos tipos de entidades
- **Pruebas exhaustivas** incluidas

**¡El sistema está listo para mejorar la experiencia visual con imágenes de perfil para usuarios y expertos!** 🚀🖼️
