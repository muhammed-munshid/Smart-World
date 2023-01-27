const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    First_Name: {
        type:String
    },
    Last_Name: {
        type:String
    },
    Address: {
        type:String
    },
    Address2: {
        type:String
    },
    Town: {
        type:String
    },
    State: {
        type:String
    },
    Country: {
        type:String
    },
    Pincode: {
        type:Number
    },
    Mobile: {
        type:Number
    },
    Email: {
        type:String
    },
    Notes: {
        type:String
    },
})

module.exports = addressModel = mongoose.model('addressModel',addressSchema)
