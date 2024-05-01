import { Schema, model } from "mongoose";

const serviceSchema = new Schema({
  nameService: {
    type: String,
    required: true
  },
  active: Boolean
})

export default model('Service', serviceSchema)