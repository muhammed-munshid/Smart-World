const bcrypt = require('bcrypt')
const { resolve } = require('path')
const { reject } = require('promise')
const userModel = require('../model/user-model')


module.exports = {

    // GET ALL USERS
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await userModel.find()
            console.log(users)
            resolve(users)
        })
    },

    // ADD USER
    addUser: (data) => {
        return new Promise(async (resolve, reject) => {
            data.Password = await bcrypt.hash(data.Password, 10)
            console.log(data.Password);
            userModel.insertOne(data).then((response) => {
                resolve(response)
            })
        })
    },
}