const userModel = require('../model/user-model')
const bcrypt = require('bcrypt')

module.exports = {

    // LOGIN
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await userModel.findOne({$and:[{ Email: userData.email },{ block:false }]})
            if (user) {
                bcrypt.compare(userData.password, user.Password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.userId =user.id;
                        response.status = true;
                        resolve(response)
                    } else {
                        response.passwordErr = true;
                        resolve(response)
                    }
                })
            } else {
                response.status = false;
                resolve(response)
            }
        })
    }
}