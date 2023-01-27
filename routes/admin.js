const express = require('express');
const storageImg = require('../multer/multer')
const adminController = require('../controller/admin-controller');
const router = express.Router();

// GET METHODS

router.get('/',adminController.admin)
router.get('/admin-dashboard',adminController.login)
router.get('/logout',adminController.logout)
router.get('/admin-products',adminController.products)
router.get('/add-products',adminController.addproducts)
router.get('/edit-products/:id',adminController.editProducts)
router.get('/edit-category/:id',adminController.editCategory)
router.get('/edit-subcategory/:id',adminController.editsubCategory)
router.get('/edit-banner/:id',adminController.editBanner)
router.get('/edit-coupon/:id',adminController.editCoupon)
router.get('/edit-news/:id',adminController.editNews)
router.get('/admin-users',adminController.adminUsers)
router.get('/admin-banner',adminController.adminBanner)
router.get('/admin-sales',adminController.adminSales)
router.get('/add-banner',adminController.addBanner)
router.get('/latest-news',adminController.latestNews)
router.get('/admin-coupon',adminController.adminCoupon)
router.get('/add-coupon',adminController.addCoupon)
router.get('/add-news',adminController.addNews)
router.get('/admin-orders',adminController.adminOrders)
router.get('/view-order/:id',adminController.viewOrder)
router.get('/admin-category',adminController.adminCategory)
router.get('/admin-subcategory',adminController.adminSubcategory)
router.get('/delete-banner/:id',adminController.deleteBanner)
router.get('/delete-coupon/:id',adminController.deleteCoupon)
router.get('/delete-news/:id',adminController.deleteNews)

// POST METHODS

router.post('/admin-dashboard',adminController.dashboard)
router.post('/add-products',storageImg.uploadImages,storageImg.resizeImages, adminController.doaddproducts)
router.post('/edit-products/:id',storageImg.uploadImages,storageImg.resizeImages, adminController.doeditProducts)
router.post('/edit-category/:id', adminController.doeditCategory)
router.post('/edit-subcategory/:id', adminController.doeditSubCategory)
router.post('/edit-banner/:id',storageImg.uploadImages,storageImg.resizeImages, adminController.doEditBanner)
router.post('/edit-coupon/:id', adminController.doeditCoupon)
router.post('/productUnblock/:id',adminController.unblockProduct)
router.post('/productBlock/:id',adminController.blockProduct)
router.post('/userUnblock/:id',adminController.unblockUser)
router.post('/userBlock/:id',adminController.blockUser)
router.post('/add-coupon',adminController.doaddCoupon)
router.post('/add-category',adminController.addCategory)
router.post('/add-banner',storageImg.uploadImages,storageImg.resizeImages,adminController.doaddBanner)
router.post('/add-news',storageImg.uploadImages,storageImg.resizeImages,adminController.doaddNews)
router.post('/edit-news/:id',storageImg.uploadImages,storageImg.resizeImages,adminController.updateNews)
router.post('/add-subcategory',adminController.addSubcategory)
router.post('/un-delete-category/:id',adminController.undeleteCategory)
router.post('/delete-category/:id',adminController.deleteCategory)
router.post('/un-delete-subcategory/:id',adminController.undeletesubCategory)
router.post('/delete-subcategory/:id',adminController.deletesubCategory)
router.post('/un-delete-coupon/:id',adminController.undeleteCoupon)
router.post('/delete-coupon/:id',adminController.deleteCoupon)

module.exports = router