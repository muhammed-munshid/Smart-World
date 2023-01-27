const mongoose = require('mongoose')

const subcategorySchema = new mongoose.Schema({
    sub_name: {
        type:String
    },
    delete: {
        type:Boolean,
        default:false
    }
})

module.exports = subcategoryModel = mongoose.model('subcategoryModel',subcategorySchema)
