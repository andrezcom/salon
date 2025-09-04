import { Request, Response } from 'express';
import User, { UserRole, ROLE_PERMISSIONS, IUser } from '../models/user';
import Business from '../models/business';
import { requireAuth, requireRole, requirePermission } from '../middleware/authorization';

export class UserManagementController {

  // Obtener todos los usuarios (solo admin)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, role, businessId, active } = req.query;
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
      
      if (role) {
        filters.role = role;
      }
      
      if (active !== undefined) {
        filters.active = active === 'true';
      }
      
      if (businessId) {
        filters.businesses = businessId;
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const users = await User.find(filters)
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass') // Excluir contraseña
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filters);

      res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener usuario por ID
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Los usuarios solo pueden ver su propio perfil, a menos que sean admin
      if (userId !== currentUserId && !['super_admin', 'admin'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este usuario'
        });
        return;
      }

      const user = await User.findById(userId)
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: { user }
      });

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear nuevo usuario
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const {
        nameUser,
        email,
        pass,
        role = 'viewer',
        businesses = [],
        defaultBusiness,
        profile,
        settings
      } = req.body;

      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Verificar que el rol sea válido
      if (!['super_admin', 'admin', 'manager', 'cashier', 'expert', 'viewer'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
        return;
      }

      // Verificar que el usuario actual tenga permisos para crear usuarios con este rol
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario actual no encontrado'
        });
        return;
      }

      // Solo super_admin puede crear otros super_admin
      if (role === 'super_admin' && currentUser.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Solo un super administrador puede crear otros super administradores'
        });
        return;
      }

      // Verificar que el email no exista
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      // Crear el usuario
      const newUser = new User({
        nameUser,
        email: email.toLowerCase(),
        pass, // En producción, esto debería estar hasheado
        role,
        businesses,
        defaultBusiness,
        profile,
        settings
      });

      await newUser.save();

      // Obtener el usuario creado sin la contraseña
      const createdUser = await User.findById(newUser._id)
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass');

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: { user: createdUser }
      });

    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar usuario
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
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
      if (userId !== currentUserId && !['super_admin', 'admin'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar este usuario'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Verificar permisos para cambiar rol
      if (updateData.role && updateData.role !== user.role) {
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
          res.status(404).json({
            success: false,
            message: 'Usuario actual no encontrado'
          });
          return;
        }

        // Solo super_admin puede cambiar roles
        if (currentUser.role !== 'super_admin') {
          res.status(403).json({
            success: false,
            message: 'Solo un super administrador puede cambiar roles de usuario'
          });
          return;
        }

        // Solo super_admin puede asignar rol de super_admin
        if (updateData.role === 'super_admin' && currentUser.role !== 'super_admin') {
          res.status(403).json({
            success: false,
            message: 'Solo un super administrador puede asignar el rol de super administrador'
          });
          return;
        }
      }

      // Actualizar el usuario
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass');

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar usuario (soft delete)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // No permitir auto-eliminación
      if (userId === currentUserId) {
        res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Solo super_admin puede eliminar usuarios
      if (req.user?.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Solo un super administrador puede eliminar usuarios'
        });
        return;
      }

      // Soft delete - marcar como inactivo
      const deletedUser = await User.findByIdAndUpdate(
        userId,
        { active: false, updatedAt: new Date() },
        { new: true }
      )
        .select('-pass');

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: { user: deletedUser }
      });

    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Restaurar usuario
  static async restoreUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Solo super_admin puede restaurar usuarios
      if (req.user?.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Solo un super administrador puede restaurar usuarios'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Restaurar usuario
      const restoredUser = await User.findByIdAndUpdate(
        userId,
        { active: true, updatedAt: new Date() },
        { new: true }
      )
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass');

      res.json({
        success: true,
        message: 'Usuario restaurado exitosamente',
        data: { user: restoredUser }
      });

    } catch (error) {
      console.error('Error restaurando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener roles disponibles
  static async getAvailableRoles(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario actual no encontrado'
        });
        return;
      }

      // Definir roles disponibles según el rol del usuario actual
      let availableRoles: { role: UserRole; name: string; description: string }[] = [];

      switch (currentUser.role) {
        case 'super_admin':
          availableRoles = [
            { role: 'super_admin', name: 'Super Administrador', description: 'Acceso completo al sistema' },
            { role: 'admin', name: 'Administrador', description: 'Administración del negocio' },
            { role: 'manager', name: 'Gerente', description: 'Gestión operativa' },
            { role: 'cashier', name: 'Cajero', description: 'Manejo de caja y ventas' },
            { role: 'expert', name: 'Experto', description: 'Servicios y comisiones' },
            { role: 'viewer', name: 'Visualizador', description: 'Solo lectura' }
          ];
          break;
        case 'admin':
          availableRoles = [
            { role: 'admin', name: 'Administrador', description: 'Administración del negocio' },
            { role: 'manager', name: 'Gerente', description: 'Gestión operativa' },
            { role: 'cashier', name: 'Cajero', description: 'Manejo de caja y ventas' },
            { role: 'expert', name: 'Experto', description: 'Servicios y comisiones' },
            { role: 'viewer', name: 'Visualizador', description: 'Solo lectura' }
          ];
          break;
        default:
          availableRoles = [
            { role: 'viewer', name: 'Visualizador', description: 'Solo lectura' }
          ];
      }

      res.json({
        success: true,
        message: 'Roles disponibles obtenidos exitosamente',
        data: { roles: availableRoles }
      });

    } catch (error) {
      console.error('Error obteniendo roles disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener permisos de un rol
  static async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      if (!['super_admin', 'admin', 'manager', 'cashier', 'expert', 'viewer'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
        return;
      }

      const permissions = ROLE_PERMISSIONS[role as UserRole];

      res.json({
        success: true,
        message: 'Permisos del rol obtenidos exitosamente',
        data: {
          role,
          permissions
        }
      });

    } catch (error) {
      console.error('Error obteniendo permisos del rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Asignar usuario a negocio
  static async assignUserToBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { userId, businessId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Verificar que el negocio existe
      const business = await Business.findById(businessId);
      if (!business) {
        res.status(404).json({
          success: false,
          message: 'Negocio no encontrado'
        });
        return;
      }

      // Verificar permisos
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario actual no encontrado'
        });
        return;
      }

      // Solo admin y super_admin pueden asignar usuarios a negocios
      if (!['super_admin', 'admin'].includes(currentUser.role)) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para asignar usuarios a negocios'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Verificar si ya está asignado
      if (user.businesses.includes(businessId as any)) {
        res.status(400).json({
          success: false,
          message: 'El usuario ya está asignado a este negocio'
        });
        return;
      }

      // Asignar usuario al negocio
      user.businesses.push(businessId as any);
      await user.save();

      const updatedUser = await User.findById(userId)
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass');

      res.json({
        success: true,
        message: 'Usuario asignado al negocio exitosamente',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Error asignando usuario a negocio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Remover usuario de negocio
  static async removeUserFromBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { userId, businessId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Verificar permisos
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario actual no encontrado'
        });
        return;
      }

      // Solo admin y super_admin pueden remover usuarios de negocios
      if (!['super_admin', 'admin'].includes(currentUser.role)) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para remover usuarios de negocios'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Remover usuario del negocio
      user.businesses = user.businesses.filter(b => b.toString() !== businessId);
      
      // Si era el negocio por defecto, limpiarlo
      if (user.defaultBusiness?.toString() === businessId) {
        user.defaultBusiness = undefined;
      }

      await user.save();

      const updatedUser = await User.findById(userId)
        .populate('businesses', 'name')
        .populate('defaultBusiness', 'name')
        .select('-pass');

      res.json({
        success: true,
        message: 'Usuario removido del negocio exitosamente',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Error removiendo usuario de negocio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
