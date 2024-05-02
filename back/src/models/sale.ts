import { Schema, model } from "mongoose";
const AutoIncrement = require('mongoose-sequence')


const saleSchema = new Schema({
  idClient: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  services: [{
    serviceId: {
      type: Number,
      required: true
    },
    expertId: {
      type: Number,
      required: true
    },
    input: [{
      inputId: {
        type: Number,
        required: true
      },
      inputPrice: {
        type: Number,
        required: true
      },
      qty: {
        type: Number,
        required: true
      },
      amount: {
        type: Number,
        required: true
      }
    }],
    amount: {
      type: Number,
      required: true
    }
  }],

  retail: [{
    productId: {
      type: Number,
      required: true
    },
    clientPrice: {
      type: Number,
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    expertId: {
      type: Number,
      required: true
    }
  }],

  total: {
    type: Number,
    required: true
  },

  paymentMethod: [{
    payment: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
})

saleSchema.plugin(AutoIncrement, { inc_field: 'idSale' });

export default model('Sale', saleSchema)