export interface Product {
  nameProduct: String,
  marca: String,
  cost: Number,
  qtyPack: Number,
  qtyUnit: Number,
  clientPrice: Number,
  inputPrice: Number,
  expertPrice: Number,
  uses: {
    input: Boolean,
    retail: Boolean
  },
  active: Boolean
}

export interface Provider {
  nameProvider: String,
  email: String,
  phone1: String,
  phone2: String,
  numberId: String,
  active: Boolean
}

export interface Client {
  nameClient: String,
  email: String,
  phone1: String,
  phone2: String,
  numberId: String,
  active: Boolean
}
export interface Expert {
  id: number
  name: string
  email: string
  document: number
  movil: string
  active: boolean
}

export interface Payment {
  namePayment: String,
  active: Boolean
}


export interface User {
  nameUser: String,
  email: String,
  pass: String,
  role: {
    admin: Boolean,
    seller: Boolean
  },
  active: Boolean
}

export interface Sale {
  idClient: string,
  nameClient: string,
  email: string,
  date: Date,
  services: Array<{
    serviceId: number,
    expertId: string, // ObjectId referenciando Person
    input: Array<{
      inputId: number,
      nameProduct: string,
      inputPrice: number,
      qty: number,
      amount: number,
    }>,
    amount: number,
  }>,
  retail: Array<{
    productId: number,
    clientPrice: number,
    qty: number,
    amount: number,
    expertId: string, // ObjectId referenciando Person
  }>,
  total: number,
  paymentMethod: Array<{
    payment: string,
    amount: number,
  }>,
  tipAndChange?: {
    tipAmount: number,
    tipPaymentMethod: 'cash' | 'card' | 'transfer',
    changeAmount: number,
    changeReason?: string,
    tipNotes?: string,
    changeNotes?: string,
  },
  businessId: string,
  status: 'completed' | 'pending' | 'cancelled',
  createdBy: string,
  active: boolean
}

export interface Service {
  nameService: {
    type: String,
    required: true
  },
  active: Boolean
}

// Extensión de Request para incluir usuario autenticado
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