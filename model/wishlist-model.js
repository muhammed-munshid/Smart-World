const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const objectId = mongoose.Types.ObjectId

const wishlistSchema = new Schema({
    user_id: {
        type: objectId,
        ref: "userData"
    },
    items: [{
        products: {
            type: objectId,
            ref: "productModel",
        },
        productPrice: {
            type: String,
            default: 0
        },
        productName: {
            type: String,
        },
        productCategory: {
            type: String,
        },
        productBrand: {
            type:objectId,
            ref:"subcategoryModel",
        },
        productImage: {
            type:Array
        }
    }],

},
);

module.exports = wishlistModel = mongoose.model('wishlistModel', wishlistSchema)