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

export interface payment {
  namePayment: String,
  active: Boolean
}

export interface product {
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

export interface user {
  nameUser: String,
  email: String,
  pass: String,
  role: {
    admin: Boolean,
    seller: Boolean
  },
  active: Boolean
}

export interface sale {
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