# 🖼️ Sistema de Imágenes de Perfil para Negocios

## 📋 Descripción

Sistema completo para manejar imágenes de perfil de negocios, incluyendo subida, almacenamiento, servicio y eliminación de imágenes.

## 🚀 Funcionalidades

### ✅ **Operaciones Implementadas:**

- **📤 Subir imagen de perfil** - Con validación de tipos y tamaños
- **🗑️ Eliminar imagen de perfil** - Eliminación física y lógica
- **📋 Obtener información de imagen** - Metadatos completos
- **🖼️ Servir imágenes** - Endpoint para mostrar imágenes
- **🔒 Validación de permisos** - Solo el propietario puede modificar

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

### 📤 **Subir Imagen de Perfil**

```http
POST /api/business/{businessId}/profile-image
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
    "business": {
      "id": "businessId",
      "name": "Nombre del Negocio",
      "profileImage": {
        "url": "/uploads/business-profiles/filename.png",
        "filename": "business-123-1234567890.png",
        "originalName": "mi-imagen.png",
        "size": 1024,
        "mimeType": "image/png",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

### 🗑️ **Eliminar Imagen de Perfil**

```http
DELETE /api/business/{businessId}/profile-image
Content-Type: application/json

{
  "userId": "userId"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Imagen de perfil eliminada exitosamente",
  "data": {
    "business": {
      "id": "businessId",
      "name": "Nombre del Negocio",
      "profileImage": null
    }
  }
}
```

### 📋 **Obtener Información de Imagen**

```http
GET /api/business/{businessId}/profile-image
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Información de imagen obtenida exitosamente",
  "data": {
    "hasImage": true,
    "profileImage": {
      "url": "/uploads/business-profiles/filename.png",
      "filename": "business-123-1234567890.png",
      "originalName": "mi-imagen.png",
      "size": 1024,
      "mimeType": "image/png",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 🖼️ **Servir Imagen**

```http
GET /api/uploads/business-profiles/{filename}
```

**Respuesta:** Archivo de imagen con headers apropiados

## 📁 Estructura de Archivos

```
back/
├── src/
│   ├── controllers/
│   │   └── businessProfile.ts    # Controlador de imágenes
│   ├── routes/
│   │   └── businessProfile.ts    # Rutas de imágenes
│   ├── models/
│   │   └── business.ts           # Modelo con campo profileImage
│   └── index.ts                  # Servidor con middleware estático
├── uploads/
│   └── business-profiles/        # Directorio de imágenes
└── test-business-profile-image.js # Script de pruebas
```

## 🔧 Configuración

### 📦 **Dependencias Instaladas:**

```bash
npm install multer @types/multer
```

### 📁 **Directorio de Uploads:**

```bash
mkdir -p uploads/business-profiles
```

### ⚙️ **Configuración de Multer:**

- **Destino:** `uploads/business-profiles/`
- **Nombres únicos:** `business-{id}-{timestamp}-{random}.{ext}`
- **Límite de tamaño:** 5MB
- **Tipos permitidos:** Solo imágenes

## 🧪 Pruebas

### 🚀 **Ejecutar Pruebas:**

```bash
node test-business-profile-image.js
```

### 📋 **Escenarios de Prueba:**

1. ✅ Creación de imagen de prueba
2. ✅ Subida de imagen de perfil
3. ✅ Obtención de información de imagen
4. ✅ Servicio de imagen
5. ✅ Eliminación de imagen de perfil
6. ✅ Verificación de eliminación

## 💡 Uso en Frontend

### 📤 **Subir Imagen:**

```javascript
const formData = new FormData();
formData.append("profileImage", file);
formData.append("userId", userId);

const response = await fetch(`/api/business/${businessId}/profile-image`, {
  method: "POST",
  body: formData,
});
```

### 🖼️ **Mostrar Imagen:**

```html
<img
  src="/api/uploads/business-profiles/filename.png"
  alt="Perfil del negocio"
/>
```

### 🗑️ **Eliminar Imagen:**

```javascript
const response = await fetch(`/api/business/${businessId}/profile-image`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId }),
});
```

## 🔒 Seguridad

### ✅ **Validaciones Implementadas:**

- **Tipos de archivo:** Solo imágenes permitidas
- **Tamaño de archivo:** Máximo 5MB
- **Permisos:** Solo el propietario puede modificar
- **Nombres únicos:** Previene conflictos
- **Limpieza:** Eliminación de archivos antiguos

### 🛡️ **Medidas de Seguridad:**

- Validación de tipos MIME
- Límites de tamaño
- Verificación de permisos
- Nombres de archivo únicos
- Eliminación segura de archivos

## 📊 Modelo de Base de Datos

### 🏢 **Campo profileImage en Business:**

```typescript
profileImage?: {
  url: string;           // URL de acceso a la imagen
  filename: string;      // Nombre del archivo en el servidor
  originalName: string;  // Nombre original del archivo
  size: number;          // Tamaño en bytes
  mimeType: string;      // Tipo MIME (image/png, etc.)
  uploadedAt: Date;      // Fecha de subida
}
```

## 🎯 Beneficios

- ✅ **Experiencia visual mejorada** con fotos de perfil
- ✅ **Gestión completa** de imágenes (subir, ver, eliminar)
- ✅ **Validaciones de seguridad** robustas
- ✅ **Almacenamiento eficiente** en sistema de archivos
- ✅ **API RESTful** fácil de usar
- ✅ **Metadatos completos** de cada imagen
- ✅ **Limpieza automática** de archivos antiguos
- ✅ **Servicio de archivos** optimizado con cache

## 🚀 Estado del Sistema

**✅ COMPLETAMENTE IMPLEMENTADO Y LISTO PARA PRODUCCIÓN**

El sistema de imágenes de perfil está completamente funcional y listo para ser usado en el frontend para mejorar la experiencia visual de los negocios.
