// eslint-disable-next-line no-undef
const userModel = require('../model/user-model')

// eslint-disable-next-line no-undef
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
   adminSession: async (req, res, next) => {
      if (req.session.adminLogin) {
        next()
      } else {
         res.redirect('/admin')
      }
   },
}