import { Request, Response } from 'express';
import Person, { PersonType, UserRole, IPerson } from '../models/person';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profile-images');
    
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
    const personId = req.params.personId;
    cb(null, `person-${personId}-${uniqueSuffix}${extension}`);
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

export class PersonController {

  // ===== CRUD BÁSICO =====

  // Obtener todas las personas con filtros
  static async getAllPersons(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        personType, 
        businessId, 
        active,
        role,
        search 
      } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Construir filtros
      const filters: any = {};
      
      if (personType) {
        filters.personType = personType;
      }
      
      if (active !== undefined) {
        filters.active = active === 'true';
      }
      
      if (role) {
        filters['userInfo.role'] = role;
      }
      
      if (businessId) {
        filters.$or = [
          { 'userInfo.businesses': businessId },
          { 'expertInfo.businessId': businessId }
        ];
      }
      
      if (search) {
        filters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const persons = await Person.find(filters)
        .populate('userInfo.businesses', 'name')
        .populate('userInfo.defaultBusiness', 'name')
        .select('-userInfo.password') // Excluir contraseña
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Person.countDocuments(filters);

      res.json({
        success: true,
        message: 'Personas obtenidas exitosamente',
        data: {
          persons,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo personas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener persona por ID
  static async getPersonById(req: Request, res: Response): Promise<void> {
    try {
      const { personId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Los usuarios solo pueden ver su propio perfil, a menos que sean admin
      if (personId !== currentUserId && !['super_admin', 'admin'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta persona'
        });
        return;
      }

      const person = await Person.findById(personId)
        .populate('userInfo.businesses', 'name')
        .populate('userInfo.defaultBusiness', 'name')
        .select('-userInfo.password');

      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Persona obtenida exitosamente',
        data: { person }
      });

    } catch (error) {
      console.error('Error obteniendo persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear nueva persona
  static async createPerson(req: Request, res: Response): Promise<void> {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        phone2,
        numberId,
        personType,
        userInfo,
        expertInfo,
        clientInfo,
        address
      } = req.body;

      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Verificar que el tipo de persona sea válido
      if (!['user', 'expert', 'client'].includes(personType)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de persona inválido'
        });
        return;
      }

      // Verificar que el usuario actual tenga permisos para crear este tipo de persona
      const currentUser = await Person.findById(currentUserId);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario actual no encontrado'
        });
        return;
      }

      // Solo super_admin puede crear otros super_admin
      if (personType === 'user' && userInfo?.role === 'super_admin' && currentUser.userInfo?.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Solo un super administrador puede crear otros super administradores'
        });
        return;
      }

      // Verificar que el email no exista
      const existingPerson = await Person.findOne({ email: email.toLowerCase() });
      if (existingPerson) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      // Crear la persona
      const newPerson = new Person({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        phone2,
        numberId,
        personType,
        userInfo,
        expertInfo,
        clientInfo,
        address
      });

      await newPerson.save();

      // Obtener la persona creada sin la contraseña
      const createdPerson = await Person.findById(newPerson._id)
        .populate('userInfo.businesses', 'name')
        .populate('userInfo.defaultBusiness', 'name')
        .select('-userInfo.password');

      res.status(201).json({
        success: true,
        message: 'Persona creada exitosamente',
        data: { person: createdPerson }
      });

    } catch (error) {
      console.error('Error creando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar persona
  static async updatePerson(req: Request, res: Response): Promise<void> {
    try {
      const { personId } = req.params;
      const updateData = req.body;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Los usuarios solo pueden actualizar su propio perfil, a menos que sean admin
      if (personId !== currentUserId && !['super_admin', 'admin'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar esta persona'
        });
        return;
      }

      const person = await Person.findById(personId);
      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      // Verificar permisos para cambiar rol
      if (updateData.userInfo?.role && updateData.userInfo.role !== person.userInfo?.role) {
        const currentUser = await Person.findById(currentUserId);
        if (!currentUser) {
          res.status(404).json({
            success: false,
            message: 'Usuario actual no encontrado'
          });
          return;
        }

        // Solo super_admin puede cambiar roles
        if (currentUser.userInfo?.role !== 'super_admin') {
          res.status(403).json({
            success: false,
            message: 'Solo un super administrador puede cambiar roles de usuario'
          });
          return;
        }

        // Solo super_admin puede asignar rol de super_admin
        if (updateData.userInfo.role === 'super_admin' && currentUser.userInfo?.role !== 'super_admin') {
          res.status(403).json({
            success: false,
            message: 'Solo un super administrador puede asignar el rol de super administrador'
          });
          return;
        }
      }

      // Actualizar la persona
      const updatedPerson = await Person.findByIdAndUpdate(
        personId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('userInfo.businesses', 'name')
        .populate('userInfo.defaultBusiness', 'name')
        .select('-userInfo.password');

      res.json({
        success: true,
        message: 'Persona actualizada exitosamente',
        data: { person: updatedPerson }
      });

    } catch (error) {
      console.error('Error actualizando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar persona (soft delete)
  static async deletePerson(req: Request, res: Response): Promise<void> {
    try {
      const { personId } = req.params;
      const { reason, permanent = false } = req.body;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // No permitir auto-eliminación
      if (personId === currentUserId) {
        res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
        return;
      }

      const person = await Person.findById(personId);
      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      // Solo super_admin puede eliminar personas
      if (req.user?.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Solo un super administrador puede eliminar personas'
        });
        return;
      }

      // Verificar si la persona tiene datos relacionados
      if (person.personType === 'expert') {
        const Sale = require('../models/sale').default;
        const recentSales = await Sale.find({
          expertId: personId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 días
        }).limit(1);

        if (recentSales.length > 0) {
          res.status(400).json({
            success: false,
            message: 'No se puede eliminar un experto con ventas recientes',
            data: { 
              suggestion: 'Use soft delete (marcar como inactivo) en lugar de eliminación permanente' 
            }
          });
          return;
        }
      }

      if (permanent) {
        await Person.findByIdAndDelete(personId);
        res.json({
          success: true,
          message: 'Persona eliminada permanentemente',
          data: { 
            deletedPerson: { 
              id: personId, 
              name: person.getFullName(), 
              email: person.email 
            } 
          }
        });
      } else {
        // Soft delete - marcar como inactivo
        const deletedPerson = await Person.findByIdAndUpdate(
          personId,
          { active: false, updatedAt: new Date() },
          { new: true }
        )
          .select('-userInfo.password');

        res.json({
          success: true,
          message: 'Persona eliminada exitosamente',
          data: { person: deletedPerson }
        });
      }

    } catch (error) {
      console.error('Error eliminando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Restaurar persona
  static async restorePerson(req: Request, res: Response): Promise<void> {
    try {
      const { personId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Solo super_admin puede restaurar personas
      if (req.user?.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Solo un super administrador puede restaurar personas'
        });
        return;
      }

      const person = await Person.findById(personId);
      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      // Restaurar persona
      const restoredPerson = await Person.findByIdAndUpdate(
        personId,
        { active: true, updatedAt: new Date() },
        { new: true }
      )
        .populate('userInfo.businesses', 'name')
        .populate('userInfo.defaultBusiness', 'name')
        .select('-userInfo.password');

      res.json({
        success: true,
        message: 'Persona restaurada exitosamente',
        data: { person: restoredPerson }
      });

    } catch (error) {
      console.error('Error restaurando persona:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // ===== GESTIÓN DE IMÁGENES DE PERFIL =====

  // Subir imagen de perfil
  static async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { personId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
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

      // Buscar la persona
      const person = await Person.findById(personId);
      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      // Verificar permisos
      if (personId !== currentUserId && !['super_admin', 'admin', 'manager'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar esta persona'
        });
        return;
      }

      // Eliminar imagen anterior si existe
      if (person.hasProfileImage()) {
        const oldImagePath = path.join(__dirname, '../../uploads/profile-images', person.profileImage!.filename);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Preparar datos de la imagen
      const imageData = {
        url: `/uploads/profile-images/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };

      // Actualizar la persona con la nueva imagen
      await person.setProfileImage(imageData);

      res.json({
        success: true,
        message: 'Imagen de perfil subida exitosamente',
        data: {
          person: {
            id: person._id,
            name: person.getFullName(),
            email: person.email,
            personType: person.personType,
            profileImage: person.profileImage
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
      const { personId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Buscar la persona
      const person = await Person.findById(personId);
      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      // Verificar permisos
      if (personId !== currentUserId && !['super_admin', 'admin', 'manager'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar esta persona'
        });
        return;
      }

      // Verificar si tiene imagen
      if (!person.hasProfileImage()) {
        res.status(400).json({
          success: false,
          message: 'La persona no tiene imagen de perfil'
        });
        return;
      }

      // Eliminar archivo físico
      if (person.profileImage?.filename) {
        const imagePath = path.join(__dirname, '../../uploads/profile-images', person.profileImage.filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Eliminar referencia de la base de datos
      await person.removeProfileImage();

      res.json({
        success: true,
        message: 'Imagen de perfil eliminada exitosamente',
        data: {
          person: {
            id: person._id,
            name: person.getFullName(),
            email: person.email,
            personType: person.personType,
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

  // Obtener información de imagen de perfil
  static async getProfileImageInfo(req: Request, res: Response): Promise<void> {
    try {
      const { personId } = req.params;

      // Buscar la persona
      const person = await Person.findById(personId);
      if (!person) {
        res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
        return;
      }

      if (!person.hasProfileImage()) {
        res.json({
          success: true,
          message: 'La persona no tiene imagen de perfil',
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
          profileImage: person.profileImage
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

  // Servir archivos de imagen
  static async serveImage(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const imagePath = path.join(__dirname, '../../uploads/profile-images', filename);

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
