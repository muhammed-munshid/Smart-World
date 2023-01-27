const userModel = require('../model/user-model')

module.exports = {
   userSession: async (req, res, next) => {
      let id = req.session.userId
      if (id) {
         let user = await userModel.findById({ _id: id })
         if (user.block) {
            req.session.destroy()
            res.redirect('/')
         } else {
            next()
         }
      } else {
         next()
      }
   },
}