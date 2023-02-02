/* eslint-disable no-undef */
const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    image: {
        type:Array,
        required:true  
    },
    Des1: {
        type:String  
    },
    Des2: {
        type:String  
    },
    Des3: {
        type:String  
    },
})

module.exports = bannerModel = mongoose.model('bannerModel',bannerSchema)
