import { Request, Response, NextFunction } from 'express';
import Person, { UserRole, ROLE_PERMISSIONS } from '../models/person';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

// Middleware para verificar si el usuario está autenticado
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Acceso denegado. Se requiere autenticación.'
    });
    return;
  }
  next();
};

// Middleware para verificar si el usuario tiene un rol específico
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
        data: {
          requiredRoles: roles,
          userRole: req.user.role
        }
      });
      return;
    }

    next();
  };
};

// Middleware para verificar permisos específicos
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.'
      });
      return;
    }

    // Verificar si el usuario tiene el permiso
    const hasPermission = checkUserPermission(req.user, module, action);
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere permiso '${action}' en el módulo '${module}'`,
        data: {
          requiredPermission: { module, action },
          userRole: req.user.role,
          userPermissions: user.userInfo?.permissions || []
        }
      });
      return;
    }

    next();
  };
};

// Middleware para verificar múltiples permisos (todos requeridos)
export const requireAllPermissions = (permissions: { module: string; action: string }[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.'
      });
      return;
    }

    const missingPermissions = permissions.filter(perm => 
      !checkUserPermission(req.user!, perm.module, perm.action)
    );

    if (missingPermissions.length > 0) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Faltan permisos requeridos.',
        data: {
          missingPermissions,
          userRole: req.user.role,
          userPermissions: user.userInfo?.permissions || []
        }
      });
      return;
    }

    next();
  };
};

// Middleware para verificar múltiples permisos (al menos uno requerido)
export const requireAnyPermission = (permissions: { module: string; action: string }[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.'
      });
      return;
    }

    const hasAnyPermission = permissions.some(perm => 
      checkUserPermission(req.user!, perm.module, perm.action)
    );

    if (!hasAnyPermission) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere al menos uno de los permisos especificados.',
        data: {
          requiredPermissions: permissions,
          userRole: req.user.role,
          userPermissions: user.userInfo?.permissions || []
        }
      });
      return;
    }

    next();
  };
};

// Middleware para verificar acceso a un negocio específico
export const requireBusinessAccess = (businessIdParam: string = 'businessId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.'
      });
      return;
    }

    const businessId = req.params[businessIdParam];
    
    if (!businessId) {
      res.status(400).json({
        success: false,
        message: 'ID de negocio requerido.'
      });
      return;
    }

    // Super admin puede acceder a cualquier negocio
    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    // Verificar si el usuario tiene acceso al negocio
    if (!user.userInfo?.businesses.includes(businessId)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. No tienes permisos para acceder a este negocio.',
        data: {
          businessId,
          userBusinesses: user.userInfo?.businesses || []
        }
      });
      return;
    }

    next();
  };
};

// Middleware para verificar si el usuario es propietario del negocio
export const requireBusinessOwnership = (businessIdParam: string = 'businessId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Acceso denegado. Se requiere autenticación.'
        });
        return;
      }

      const businessId = req.params[businessIdParam];
      
      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'ID de negocio requerido.'
        });
        return;
      }

      // Super admin puede hacer cualquier cosa
      if (req.user.role === 'super_admin') {
        next();
        return;
      }

      // Buscar el negocio para verificar el propietario
      const Business = require('../models/business').default;
      const business = await Business.findById(businessId);
      
      if (!business) {
        res.status(404).json({
          success: false,
          message: 'Negocio no encontrado.'
        });
        return;
      }

      // Verificar si el usuario es el propietario
      if (business.ownerId.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo el propietario puede realizar esta acción.',
          data: {
            businessId,
            ownerId: business.ownerId,
            userId: req.user.id
          }
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error verificando propiedad del negocio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
};

// Función auxiliar para verificar permisos de usuario
function checkUserPermission(user: any, module: string, action: string): boolean {
  // Si el usuario tiene permisos personalizados, usarlos
  if (user.permissions && user.permissions.length > 0) {
    const modulePermission = user.permissions.find((p: any) => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  // Si no, usar los permisos del rol
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (rolePermissions) {
    const modulePermission = rolePermissions.find(p => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  return false;
}

// Middleware para logging de accesos
export const logAccess = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      console.log(`[ACCESS LOG] User ${req.user.email} (${req.user.role}) performed action: ${action}`);
    }
    next();
  };
};

// Middleware para verificar si el usuario está activo y no bloqueado
export const requireActiveUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere autenticación.'
      });
      return;
    }

    // Buscar el usuario en la base de datos para verificar su estado
    const user = await Person.findOne({ _id: req.user.id, personType: 'user' });
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
      return;
    }

    if (!user.isActive()) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Usuario inactivo o bloqueado.',
        data: {
          active: user.active,
          isLocked: user.isLocked(),
          lockUntil: user.lockUntil
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Combinaciones comunes de middleware
export const requireAdmin = [requireAuth, requireRole('super_admin', 'admin')];
export const requireManager = [requireAuth, requireRole('super_admin', 'admin', 'manager')];
export const requireCashier = [requireAuth, requireRole('super_admin', 'admin', 'manager', 'cashier')];
export const requireExpert = [requireAuth, requireRole('super_admin', 'admin', 'manager', 'cashier', 'expert')];

// Middleware para operaciones de caja
export const requireCashAccess = [
  requireAuth,
  requireAnyPermission([
    { module: 'cash', action: 'create' },
    { module: 'cash', action: 'read' },
    { module: 'cash', action: 'update' }
  ])
];

// Middleware para operaciones de inventario
export const requireInventoryAccess = [
  requireAuth,
  requireAnyPermission([
    { module: 'inventory', action: 'create' },
    { module: 'inventory', action: 'read' },
    { module: 'inventory', action: 'update' }
  ])
];

// Middleware para operaciones de ventas
export const requireSalesAccess = [
  requireAuth,
  requireAnyPermission([
    { module: 'sales', action: 'create' },
    { module: 'sales', action: 'read' },
    { module: 'sales', action: 'update' }
  ])
];
