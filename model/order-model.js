const mongoose = require('mongoose')
const addressModel = require('./address-model')
const Objectid = mongoose.Types.ObjectId

const orderSchema = new mongoose.Schema({
    user_id: {
        type:Objectid
    },
    address: {
        type:Objectid,
        ref:'addressModel'
    },
    products: {
        type:Array
    },
    discount: {
        type:Number,
    },
    total: {
        type:Number
    },
    grandTotal: {
        type:Number
    },
    paymentMethod: {
        type:String
    },
    status: {
        type:String
    },
    date: {
        type:Date
    }
})

module.exports = orderModel = mongoose.model('orderModel',orderSchema)
