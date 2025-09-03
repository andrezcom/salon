import { Schema, model } from "mongoose";

const clientSchema = new Schema({
  nameCompany: {
    type: String,
    required: true,
    unique: true
  },
  idCompany: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone2: {
    type: String,
    required: false
  },
  active: Boolean
})

export default model('Client', clientSchema)