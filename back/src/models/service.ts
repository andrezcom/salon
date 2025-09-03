import { Schema, model } from "mongoose";

const serviceSchema = new Schema({
  nameService: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  active: Boolean
})

export default model('Service', serviceSchema)