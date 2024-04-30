import { Schema, model } from "mongoose";

const userSchema = new Schema({
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

})

export default model('User', userSchema)