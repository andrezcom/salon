import { Schema, model } from "mongoose";

const paymentSchema = new Schema({
  namePayment: {
    type: String,
    required: true
  },
  active: Boolean
})

export default model('Payment', paymentSchema)