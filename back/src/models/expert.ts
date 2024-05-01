import { Schema, model } from "mongoose";

const expertSchema = new Schema({
  nameExpert: {
    type: String,
    required: true
  },
  aliasExpert: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    stylist: Boolean,
    manicure: Boolean,
    makeup: Boolean
  },
  percent: {
    type: Number,
    required: true
  },
  active: Boolean
})

export default model('Expert', expertSchema)