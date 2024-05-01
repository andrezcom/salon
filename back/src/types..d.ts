export interface expert {
  id: number
  name: string
  email: string
  document: number
  movil: string
  active: boolean
}

export interface user {
  nameUser: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  pass: {
    type: String,
    required: true
  },
  role: {
    admin: Boolean,
    seller: Boolean
  },
  active: Boolean
}
