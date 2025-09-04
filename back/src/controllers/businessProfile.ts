import { Request, Response } from 'express';
import Business from '../models/business';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/business-profiles');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `business-${req.params.businessId}-${uniqueSuffix}${extension}`);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
  }
};

// Configuración de multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: fileFilter
});

export class BusinessProfileController {
  
  // Subir imagen de perfil
  static async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
        return;
      }

      // Buscar el negocio
      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({
          success: false,
          message: 'Negocio no encontrado'
        });
        return;
      }

      // Verificar permisos (opcional: solo el propietario puede cambiar la imagen)
      if (business.ownerId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar este negocio'
        });
        return;
      }

      // Eliminar imagen anterior si existe
      if (business.profileImage && business.profileImage.filename) {
        const oldImagePath = path.join(__dirname, '../../uploads/business-profiles', business.profileImage.filename);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Preparar datos de la imagen
      const imageData = {
        url: `/uploads/business-profiles/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };

      // Actualizar el negocio con la nueva imagen
      await business.setProfileImage(imageData);

      res.json({
        success: true,
        message: 'Imagen de perfil subida exitosamente',
        data: {
          business: {
            id: business._id,
            name: business.name,
            profileImage: business.profileImage
          }
        }
      });

    } catch (error) {
      console.error('Error subiendo imagen de perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar imagen de perfil
  static async removeProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Buscar el negocio
      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({
          success: false,
          message: 'Negocio no encontrado'
        });
        return;
      }

      // Verificar permisos
      if (business.ownerId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar este negocio'
        });
        return;
      }

      // Verificar si tiene imagen
      if (!business.hasProfileImage()) {
        res.status(400).json({
          success: false,
          message: 'El negocio no tiene imagen de perfil'
        });
        return;
      }

      // Eliminar archivo físico
      if (business.profileImage && business.profileImage.filename) {
        const imagePath = path.join(__dirname, '../../uploads/business-profiles', business.profileImage.filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Eliminar referencia de la base de datos
      await business.removeProfileImage();

      res.json({
        success: true,
        message: 'Imagen de perfil eliminada exitosamente',
        data: {
          business: {
            id: business._id,
            name: business.name,
            profileImage: null
          }
        }
      });

    } catch (error) {
      console.error('Error eliminando imagen de perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener información de la imagen de perfil
  static async getProfileImageInfo(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;

      // Buscar el negocio
      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({
          success: false,
          message: 'Negocio no encontrado'
        });
        return;
      }

      if (!business.hasProfileImage()) {
        res.json({
          success: true,
          message: 'El negocio no tiene imagen de perfil',
          data: {
            hasImage: false,
            profileImage: null
          }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Información de imagen obtenida exitosamente',
        data: {
          hasImage: true,
          profileImage: business.profileImage
        }
      });

    } catch (error) {
      console.error('Error obteniendo información de imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Servir archivos de imagen (endpoint para servir las imágenes)
  static async serveImage(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const imagePath = path.join(__dirname, '../../uploads/business-profiles', filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(imagePath)) {
        res.status(404).json({
          success: false,
          message: 'Imagen no encontrada'
        });
        return;
      }

      // Determinar el tipo de contenido
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      // Establecer headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año

      // Enviar el archivo
      res.sendFile(imagePath);

    } catch (error) {
      console.error('Error sirviendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
