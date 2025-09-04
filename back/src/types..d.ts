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
  idClient: String,
  nameClient: String,
  email: String,
  date: Date,
  services: [{
    serviceId: Number,
    expertId: Number,
    input: [{
      inputId: Number,
      nameProduct: String,
      inputPrice: Number,
      qty: Number,
      amount: Number,
    }],
    amount: Number,
  }],
  retail: [{
    productId: Number,
    clientPrice: Number,
    qty: Number,
    amount: Number,
    expertId: Number,
  }],
  total: Number,
  paymentMethod: [{
    payment: String,
    amount: Number,
  }],
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