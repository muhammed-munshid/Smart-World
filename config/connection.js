// eslint-disable-next-line no-undef
const mongoose = require('mongoose')

// eslint-disable-next-line no-undef
module.exports.connect = function () {
    mongoose.connect('mongodb+srv://munshid:munshid123@cluster0.fyiocsw.mongodb.net/test')
}
