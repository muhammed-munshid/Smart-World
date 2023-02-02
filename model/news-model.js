/* eslint-disable no-undef */
const mongoose = require('mongoose')

const newsSchema = new mongoose.Schema({
    Image: {
        type:Array
    },
    Date: {
        type:String
    },
    Title: {
        type:String
    },
    Description: {
        type:String
    }
})

module.exports = newsModel = mongoose.model('newsModel',newsSchema)
