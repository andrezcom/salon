import { Schema, model } from "mongoose";

const providerSchema = new Schema({
  nameProvider: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone1: {
    type: String,
    required: true
  },
  phone2: {
    type: String,
    required: false
  },
  numberId: {
    type: String,
    required: false
  },
  active: Boolean
})

export default model('Provider', providerSchema)