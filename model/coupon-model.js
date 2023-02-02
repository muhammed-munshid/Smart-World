/* eslint-disable no-undef */
const mongoose = require('mongoose')
const Objectid = mongoose.Types.ObjectId
const couponSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    code: {
        type: String,
    },
    discount: {
        type: Number,
        default: 0
    },
    min_amount: {
        type: Number,
    },
    max_discount: {
        type: Number,
    },
    create_date: {
        type: Date,
    },
    expiry_date: {
        type: Date,
    },
    users: [Objectid],
    is_deleted: { type: Boolean, default: false }
})

module.exports = couponModel = mongoose.model('couponModel', couponSchema)