/* eslint-disable no-undef */
const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    cat_name: {
        type:String
    },
    delete: {
        type:Boolean,
        default:false
    }
})

module.exports = categoryModel = mongoose.model('categoryModel',categorySchema)
