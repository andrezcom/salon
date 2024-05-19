export interface User {
  _id: String,
  nameUser: String,
  email: String,
  pass: String,
  role: {
    admin: Boolean,
    seller: Boolean
  },
  active: Boolean
}