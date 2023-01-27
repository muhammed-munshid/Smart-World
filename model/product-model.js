const mongoose = require('mongoose')
const subCategoryModel = require('./sub-category-model')
const objectId = mongoose.Types.ObjectId

const productSchema = new mongoose.Schema({
    name : {
        type:String,
        required:true
    },
    description : {
        type:String,
        required:true
    },
    category : {
        type:String,
        required:true
    },
    brand : {
        type:objectId,
        ref:"subcategoryModel",
    },
    price: {
        type:Number,
        required:true
    },
    image: {
        type:Array
    },
    block: {
        type:Boolean,
        default:false
    }
})

module.exports = productModel = mongoose.model('productModel',productSchema)