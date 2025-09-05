import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Person from '../models/person';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        businessId: string;
        email: string;
        name: string;
        role: string;
        permissions?: any[];
        userInfo?: {
          businesses: string[];
          permissions: any[];
        };
      };
    }
  }
}

// Middleware para verificar JWT y cargar información del usuario
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
      return;
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token establecido') as any;
    
    // Buscar el usuario en la base de datos
    const user = await Person.findOne({ 
      _id: decoded.id, 
      personType: 'user',
      active: true 
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
      return;
    }

    // Cargar información del usuario en req.user
    req.user = {
      id: user._id.toString(),
      businessId: user.businessId || '',
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      permissions: user.permissions,
      userInfo: {
        businesses: user.businesses || [],
        permissions: user.permissions || []
      }
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    } else {
      console.error('Error en autenticación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

// Middleware para verificar si el usuario está autenticado (sin cargar datos completos)
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
export const requireRole = (...roles: string[]) => {
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
          userPermissions: req.user.userInfo?.permissions || []
        }
      });
      return;
    }

    next();
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
  
  // Si no, usar los permisos del rol (importar ROLE_PERMISSIONS)
  const { ROLE_PERMISSIONS } = require('../models/person');
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (rolePermissions) {
    const modulePermission = rolePermissions.find((p: any) => p.module === module);
    if (modulePermission) {
      return modulePermission.actions.includes(action);
    }
  }
  
  return false;
}

// Combinaciones comunes de middleware
export const requireAdmin = [authenticateToken, requireRole('super_admin', 'admin')];
export const requireManager = [authenticateToken, requireRole('super_admin', 'admin', 'manager')];
export const requireCashier = [authenticateToken, requireRole('super_admin', 'admin', 'manager', 'cashier')];
export const requireExpert = [authenticateToken, requireRole('super_admin', 'admin', 'manager', 'cashier', 'expert')];

// Middleware para operaciones de proveedores
export const requireSupplierAccess = [
  authenticateToken,
  requireAnyPermission([
    { module: 'suppliers', action: 'create' },
    { module: 'suppliers', action: 'read' },
    { module: 'suppliers', action: 'update' }
  ])
];

// Middleware para operaciones de cuentas por pagar
export const requireAccountsPayableAccess = [
  authenticateToken,
  requireAnyPermission([
    { module: 'accountsPayable', action: 'create' },
    { module: 'accountsPayable', action: 'read' },
    { module: 'accountsPayable', action: 'update' }
  ])
];

// Middleware para operaciones de órdenes de compra
export const requirePurchaseOrderAccess = [
  authenticateToken,
  requireAnyPermission([
    { module: 'purchaseOrders', action: 'create' },
    { module: 'purchaseOrders', action: 'read' },
    { module: 'purchaseOrders', action: 'update' }
  ])
];

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
          userPermissions: req.user.userInfo?.permissions || []
        }
      });
      return;
    }

    next();
  };
};
