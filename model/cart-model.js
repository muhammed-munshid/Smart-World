const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Objectid = mongoose.Types.ObjectId

const cartSchema = new Schema({
    user_id: {
        type: Objectid,
        ref: "userData"
    },
    items: [{
        products: {
            type: Objectid,
            ref: "productModel",
        },
        quantity: { 
            type: Number,
            default: 1
        },
        productPrice: {
            type: String,
            default: 0
        },
        productName: {
            type: String,
        },
        productImage: {
            type:Array
        },
        totalPrice: {
            type: Number,
            default: 0
        },
    }],
    total: {
        type: Number,
        default: 0
    },
    discount:{
        couponId:Objectid,
        amount: {type:Number,default:0}
    },
    grandTotal:{
        type:Number
    }

},
);


module.exports = cartModel = mongoose.model('cartModel', cartSchema)