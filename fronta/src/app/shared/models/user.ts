export interface User {
  _id: String,
  nameUser: String,
  email: String,
  pass: String,
  role: {
    admin: boolean,
    seller: boolean
  },
  active?: Boolean
}

export type newUser = Omit<User, "_id">
