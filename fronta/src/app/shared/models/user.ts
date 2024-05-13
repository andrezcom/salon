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