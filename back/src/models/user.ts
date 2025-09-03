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
  active: Boolean,
  businesses: [{
    type: Schema.Types.ObjectId,
    ref: 'Business'
  }],
  defaultBusiness: {
    type: Schema.Types.ObjectId,
    ref: 'Business'
  }
}, {
  timestamps: true
})

export default model('User', userSchema)