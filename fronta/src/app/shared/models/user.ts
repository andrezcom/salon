export interface User {
  _id: string,
  nameUser: string,
  email: string,
  pass: string,
  role: {
    admin: boolean,
    seller: boolean
  },
  active: boolean
}

export type newUser = Omit<User, "_id">
