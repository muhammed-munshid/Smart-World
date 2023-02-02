/* eslint-disable no-undef */
const mongoose = require('mongoose')
// eslint-disable-next-line no-unused-vars
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
    paymentStatus: {
        type:String
    },
    orderStatus: {
        type:String
    },
    date: {
        type:Date
    }
})

module.exports = orderModel = mongoose.model('orderModel',orderSchema)
