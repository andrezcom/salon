import { Schema, model } from "mongoose";

const productSchema = new Schema({
  nameProduct: {
    type: String,
    required: true
  },
  marca: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  qtyPack: {
    type: Number,
    required: true
  },
  qtyUnit: {
    type: Number,
    required: true
  },
  clientPrice: {
    type: Number,
    required: true
  },
  inputPrice: {
    type: Number,
    required: true
  },
  expertPrice: {
    type: Number,
    required: true
  },
  uses: {
    input: Boolean,
    retail: Boolean
  },
  active: Boolean
})

export default model('Product', productSchema)