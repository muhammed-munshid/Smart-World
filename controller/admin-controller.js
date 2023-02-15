/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const productModel = require("../model/product-model")
const userModel = require('../model/user-model')
const categoryModel = require("../model/category-model")
const subcategoryModel = require("../model/sub-category-model")
const cartModel = require('../model/cart-model')
const orderModel = require("../model/order-model")
const couponModel = require("../model/coupon-model")
const bannerModel = require("../model/banner-model")
const newsModel = require("../model/news-model")
let objectId = require('objectid')

const { resolve } = require('path')
const { response } = require('express')
const { category } = require('./user-controller')

let emailid = "admin@gmail.com"
let mypassword = "12345"

// eslint-disable-next-line no-undef
module.exports = {

    // ADMIN LOGIN PAGE
    adminLogin: (req, res) => {
        try {
            res.render('admin/admin-login')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADMIN LOGIN
    doLogin: async (req, res) => {
        try {
            let email = req.body.email
            let password = req.body.password
            if (email === emailid && password === mypassword) {
                req.session.adminLogin = true
                let Orders = await orderModel.find().populate('address').sort({ date: -1 })
                let count = await orderModel.find().countDocuments()
                let liveOrders = await orderModel.find({ orderStatus: { $nin: ["Delivered", "Cancelled","returned"] } }).countDocuments()
                let users = await userModel.find({ block: false }).countDocuments()
                let onlineCount = (await orderModel.find({ paymentMethod: 'online' })).length
                let codCount = (await orderModel.find({ paymentMethod: 'COD' })).length
                let online = await orderModel.aggregate([
                    { '$match': { $and: [{ 'paymentMethod': 'online' }, { 'orderStatus': { '$ne': [ 'Cancelled','returned' ] } }] } },
                    {
                        '$group': {
                            '_id': null, 'total': { '$sum': { '$ifNull': ["$total", 0] } },
                            'grandTotal': { '$sum': { '$ifNull': ["$grandTotal", 0] } }
                        }
                    }
                ])
                let sales = await orderModel.aggregate([
                    { '$match': { 'orderStatus': { '$ne': [ 'Cancelled','returned' ] } } },
                    {
                        '$group': {
                            '_id': null, 'totalCount': { '$sum': { '$ifNull': ["$total", 0] } },
                            'grandTotalCount': { '$sum': { '$ifNull': ["$grandTotal", 0] } }
                        }
                    }
                ])
                let totalPayment = online.map(a => a.total)
                let grandTotal = online.map(a => a.grandTotal)
                const discount = totalPayment - grandTotal
                const onlinePayments = totalPayment - discount
                let totalCount = sales.map(a => a.totalCount)
                let grandTotalCount = sales.map(a => a.grandTotalCount)
                const discountSales = totalCount - grandTotalCount
                const totalSales = totalCount - discountSales
                res.render('admin/admin-dashboard', {
                    Orders, liveOrders, count, users, onlineCount, codCount, onlinePayments, totalSales, dashboard: true, product: false, user: false, category: false,
                    subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
                })
            }
            else {
                req.session.loginErr = true
                res.redirect('/admin')
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADMIN DASHBOARD
    dashboard: async (req, res) => {
        try {
            let Orders = await orderModel.find().populate('address').sort({ date: -1 })
            let count = await orderModel.find().countDocuments()
            let liveOrders = await orderModel.find({ orderStatus: { $nin: ["Delivered", "Cancelled","returned"] } }).countDocuments()
            let users = await userModel.find({ block: false }).countDocuments()
            let onlineCount = (await orderModel.find({ paymentMethod: 'online' })).length
            let codCount = (await orderModel.find({ paymentMethod: 'COD' })).length
            let online = await orderModel.aggregate([
                { '$match': { $and: [{ 'paymentMethod': 'online' }, { 'orderStatus': { '$ne': 'Cancelled' } }] } },
                {
                    '$group': {
                        '_id': null, 'total': { '$sum': { '$ifNull': ["$total", 0] } },
                        'grandTotal': { '$sum': { '$ifNull': ["$grandTotal", 0] } }
                    }
                }
            ])
            let sales = await orderModel.aggregate([
                { '$match': { 'orderStatus': { '$ne': 'Cancelled' } } },
                {
                    '$group': {
                        '_id': null, 'totalCount': { '$sum': { '$ifNull': ["$total", 0] } },
                        'grandTotalCount': { '$sum': { '$ifNull': ["$grandTotal", 0] } }
                    }
                }
            ])
            let totalPayment = online.map(a => a.total)
            let grandTotal = online.map(a => a.grandTotal)
            const discount = totalPayment - grandTotal
            const onlinePayments = totalPayment - discount
            let totalCount = sales.map(a => a.totalCount)
            let grandTotalCount = sales.map(a => a.grandTotalCount)
            const discountSales = totalCount - grandTotalCount
            const totalSales = totalCount - discountSales
            res.render('admin/admin-dashboard', {
                Orders, liveOrders, count, users, onlineCount, codCount, onlinePayments, totalSales, dashboard: true, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADMIN LOGOUT
    logout: (req, res) => {
        req.session.destroy()
        res.redirect('/admin')
    },

    // PRODUCTS PAGE
    products: async (req, res) => {
        try {
            let products = await productModel.find().populate('brand')
            res.render('admin/admin-products', {
                products, dashboard: false, product: true, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD PRODUCTS PAGE
    addproducts: async (req, res) => {
        try {
            let categories = await categoryModel.find()
            let subCategories = await subcategoryModel.find()
            res.render('admin/add-products', {
                categories, subCategories, dashboard: false, product: true, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD PRODUCTS
    doaddproducts: (req, res) => {
        try {
            let data = req.body
            let image = req.body.images
            const { name, description, category, brand_name, price, stock } = data
            const addproduct = productModel({
                name: name,
                description: description,
                category: category,
                brand: brand_name,
                price: price,
                stock: stock,
                image: image
            })
            addproduct.save()
                .then(() => {
                    res.redirect('/admin/admin-products')
                })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT PRODUCTS PAGE
    editProducts: async (req, res) => {
        try {
            let productId = req.params.id
            let products = await productModel.findOne({ _id: productId })
            let categories = await categoryModel.find()
            let subCategories = await subcategoryModel.find()
            res.render('admin/edit-products', {
                products, categories, subCategories, dashboard: false, product: true, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT PRODUCTS
    doeditProducts: async (req, res) => {
        try {
            let productId = req.params.id;
            let editproduct = req.body
            let image = req.body.images
            await productModel.updateOne({ _id: productId }, {
                $set: {
                    name: editproduct.name,
                    description: editproduct.description,
                    category: editproduct.category,
                    brand: editproduct.brand_name,
                    price: editproduct.price,
                    stock: editproduct.stock,
                    image: image
                }
            })
            res.redirect('/admin/admin-products')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT CATEGORY PAGE
    editCategory: async (req, res) => {
        try {
            let categoryId = req.params.id
            let Category = await categoryModel.findOne({ _id: categoryId })
            res.render('admin/edit-category', {
                Category, dashboard: false, product: false, user: false, category: true,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT CATEGORY
    doeditCategory: async (req, res) => {
        try {
            let categoryId = req.params.id
            let editCategory = req.body
            await categoryModel.updateOne({ _id: categoryId }, {
                $set: {
                    cat_name: editCategory.name
                }
            })
            res.redirect('/admin/admin-category')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT SUBCATEGORY PAGE
    editsubCategory: async (req, res) => {
        try {
            let categoryId = req.params.id
            let SubCategory = await subcategoryModel.findOne({ _id: categoryId })
            res.render('admin/edit-subcategory', {
                SubCategory, dashboard: false, product: false, user: false, category: false,
                subCategory: true, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT SUBCATEGORY
    doeditSubCategory: async (req, res) => {
        try {
            let subCategoryId = req.params.id
            let editSubCategory = req.body
            await subcategoryModel.updateOne({ _id: subCategoryId }, {
                $set: {
                    sub_name: editSubCategory.name
                }
            })
            res.redirect('/admin/admin-subcategory')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT BANNER PAGE
    editBanner: async (req, res) => {
        try {
            let editId = req.params.id
            let Banner = await bannerModel.findOne({ _id: editId })
            res.render('admin/edit-banner', {
                Banner, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: true, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT BANNER
    doEditBanner: async (req, res) => {
        try {
            let editId = req.params.id
            let image = req.body.images
            await bannerModel.updateOne({ _id: editId }, {
                $set: {
                    image: image
                }
            })
            res.redirect('/admin/admin-banner')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT COUPON PAGE
    editCoupon: async (req, res) => {
        try {
            let couponId = req.params.id
            let Coupon = await couponModel.findOne({ _id: couponId })
            res.render('admin/edit-coupon', {
                Coupon, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: true, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT COUPON
    doeditCoupon: async (req, res) => {
        try {
            let couponId = req.params.id
            let editCoupon = req.body
            const { name, code, discount, min_amount, max_discount, create_date, expiry_date } = editCoupon
            await couponModel.updateOne({ _id: couponId }, {
                $set: {
                    name: name,
                    code: code,
                    discount: discount,
                    min_amount: min_amount,
                    max_discount: max_discount,
                    create_date: create_date,
                    expiry_date: expiry_date
                }
            })
            res.redirect('/admin/admin-coupon')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // UNBLOCK PRODUCT
    unblockProduct: async (req, res) => {
        try {
            let productId = req.params.id;
            await productModel.updateOne({ _id: productId }, { $set: { block: false } })
            res.redirect("/admin/admin-products");
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // BLOCK PRODUCT
    blockProduct: async (req, res) => {
        try {
            let productId = req.params.id;
            await productModel.updateOne({ _id: productId }, { $set: { block: true } });
            res.redirect("/admin/admin-products");
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADMIN USERS
    adminUsers: async (req, res) => {
        let users = await userModel.find()
        console.log(users);
        res.render('admin/admin-users', {
            users, dashboard: false, product: false, user: true, category: false,
            subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
        })
    },

    // ADD BANNER
    addBanner: async (req, res) => {
        res.render('admin/add-banner', {
            dashboard: false, product: false, user: false, category: false,
            subCategory: false, banner: true, news: false, orders: false, coupon: false, sales: false
        })
    },

    // ADD BANNER
    doaddBanner: async (req, res) => {
        let description = req.body
        let { des1, des2, des3 } = description
        let Image = req.body.images
        await bannerModel({
            Des1: des1,
            Des2: des2,
            Des3: des3,
            image: Image
        }).save()
        res.redirect('/admin/admin-banner')
    },

    // BANNER PAGE
    adminBanner: async (req, res) => {
        try {
            let banners = await bannerModel.find()
            res.render('admin/admin-banner', {
                banners, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: true, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // NEWS PAGE
    latestNews: async (req, res) => {
        try {
            let newses = await newsModel.find()
            res.render('admin/latest-news', {
                newses, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: true, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // SALES REPORT PAGE
    adminSales: async (req, res) => {
        try {
            let allOrders = await orderModel.find().populate('address')
            console.log(allOrders);
            let fromDate = 0
            let toDateRef = 0
            let realToDate = 0
            res.render('admin/admin-sales', {
                allOrders, fromDate, toDateRef, realToDate, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: true
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    searchDate: async (req, res) => {
        try {
            let fromDate = req.body.fromDate
            let toDateRef = req.body.toDate
            console.log(fromDate);
            console.log(toDateRef);
            let toDate = new Date(toDateRef)
            let realToDate = toDate.setDate(toDate.getDate() + 1);
            console.log(realToDate);
            let allOrders = await orderModel.find({ date: { $gte: fromDate, $lte: realToDate } }).populate('address').sort({ date: -1 })
            res.render('admin/admin-sales', {
                allOrders, fromDate, realToDate, toDateRef, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: true
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },
    // ADD NEWS PAGE
    addNews: (req, res) => {
        res.render('admin/add-news', {
            dashboard: false, product: false, user: false, category: false,
            subCategory: false, banner: false, news: true, orders: false, coupon: false, sales: false
        })
    },

    // ADD NEWS
    doaddNews: async (req, res) => {
        try {
            let image = req.body.images
            let news = req.body
            let { date, title, description } = news
            await newsModel({
                Image: image,
                Date: date,
                Title: title,
                Description: description
            }).save()
            res.redirect('/admin/latest-news')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT NEWS PAGE
    editNews: async (req, res) => {
        let productId = req.params.id
        let News = await newsModel.findOne({ _id: productId })
        res.render('admin/edit-news', {
            News, dashboard: false, product: false, user: false, category: false,
            subCategory: false, banner: false, news: true, orders: false, coupon: false, sales: false
        })
    },

    // EDIT PAGE
    updateNews: async (req, res) => {
        try {
            let newsId = req.params.id
            let image = req.body.images
            console.log(image);
            let news = req.body
            let { date, title, description } = news
            await newsModel.updateMany({ _id: newsId }, {
                $set: {
                    Image: image,
                    Date: date,
                    Title: title,
                    Description: description
                }
            })
            res.redirect('/admin/latest-news')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // UNBLOCK USER
    unblockUser: async (req, res) => {
        try {
            let userId = req.params.id;
            await userModel.updateOne({ _id: userId }, { $set: { block: false } });
            res.redirect("/admin/admin-users");
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // BLOCK USER
    blockUser: async (req, res) => {
        try {
            let userId = req.params.id;
            await userModel.updateOne({ _id: userId }, { $set: { block: true } });
            res.redirect("/admin/admin-users");
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // CATEGORY PAGE
    adminCategory: async (req, res) => {
        try {
            let categories = await categoryModel.find()
            res.render('admin/admin-category', {
                categories, dashboard: false, product: false, user: false, category: true,
                subCategory: false, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD CATEGORY
    addCategory: async (req, res) => {
        let catName = req.body.name
        let catNames = catName.toUpperCase()
        let samecatName = await categoryModel.find({ cat_name: catNames })
        let length = samecatName.length
        console.log(length);
        if (length != 0) {
            res.redirect('/admin/admin-category')
        } else {
            await categoryModel({ cat_name: catNames }).save()
            res.redirect('/admin/admin-category')
        }
    },

    // UNDELETE CATEGORY
    undeleteCategory: async (req, res) => {
        let categoryId = req.params.id;
        await categoryModel.updateOne({ _id: categoryId }, { $set: { delete: false } })
        res.redirect("/admin/admin-category");
    },

    // DELETE CATEGORY
    deleteCategory: async (req, res) => {
        let categoryId = req.params.id;
        await categoryModel.updateOne({ _id: categoryId }, { $set: { delete: true } })
        res.redirect("/admin/admin-category");
    },

    // SUBCATEGORY
    adminSubcategory: async (req, res) => {
        let subCategories = await subcategoryModel.find()
        try {
            res.render('admin/admin-subcategory', {
                subCategories, dashboard: false, product: false, user: false, category: false,
                subCategory: true, banner: false, news: false, orders: false, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD SUBCATEGORY
    addSubcategory: async (req, res) => {
        let subCatName = req.body.name
        let subCatNames = subCatName.toUpperCase()
        let samesubName = await subcategoryModel.find({ sub_name: subCatNames })
        let length = samesubName.length
        if (length) {
            res.redirect('/admin/admin-subcategory')
        } else {
            await subcategoryModel({ sub_name: subCatNames }).save()
            res.redirect('/admin/admin-subcategory')
        }
    },

    // UNDELETE SUBCATEGORY/
    undeletesubCategory: async (req, res) => {
        let subCategoryId = req.params.id;
        await subcategoryModel.updateOne({ _id: subCategoryId }, { $set: { delete: false } })
        res.redirect("/admin/admin-subcategory");
    },

    // DELETE SUBCATEGORY
    deletesubCategory: async (req, res) => {
        let subCategoryId = req.params.id;
        await subcategoryModel.updateOne({ _id: subCategoryId }, { $set: { delete: true } })
        res.redirect("/admin/admin-subcategory");
    },

    // COUPON PAGE
    adminCoupon: async (req, res) => {
        try {
            let Coupon = await couponModel.find()
            res.render('admin/admin-coupon', {
                Coupon, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: false, coupon: true, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD COUPON PAGE
    addCoupon: async (req, res) => {
        res.render('admin/add-coupon', {
            dashboard: false, product: false, user: false, category: false,
            subCategory: false, banner: false, news: false, orders: false, coupon: true, sales: false
        })
    },

    // ADD COUPON
    doaddCoupon: async (req, res) => {
        try {
            let data = req.body
            const { name, code, discount, min_amount, max_discount, create_date, expiry_date } = data
            await couponModel({
                name: name,
                code: code,
                discount: discount,
                min_amount: min_amount,
                max_discount: max_discount,
                create_date: create_date,
                expiry_date: expiry_date
            }).save()
            res.redirect('/admin/admin-coupon')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // DELETE BANNER
    deleteBanner: async (req, res) => {
        let deleteBanner = req.params.id
        await bannerModel.deleteOne({ _id: deleteBanner })
        res.redirect('/admin/admin-banner')
    },

    // UNDELETE COUPON
    undeleteCoupon: async (req, res) => {
        let couponId = req.params.id;
        await couponModel.updateOne({ _id: couponId }, { $set: { is_deleted: false } })
        res.redirect("/admin/admin-coupon");
    },

    // DELETE COUPON
    deleteCoupon: async (req, res) => {
        let couponId = req.params.id;
        await couponModel.updateOne({ _id: couponId }, { $set: { is_deleted: true } })
        res.redirect("/admin/admin-coupon");
    },

    // DELETE NEWS
    deleteNews: async (req, res) => {
        let deleteNews = req.params.id
        await newsModel.deleteOne({ _id: deleteNews })
        res.redirect('/admin/latest-news')
    },

    // ORDERS PAGE
    adminOrders: async (req, res) => {
        try {
            let Orders = await orderModel.find().populate('address').sort({ date: -1 })
            res.render('admin/admin-orders', {
                Orders, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: true, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // STATUS CHANGE
    statusChange: async (req, res) => {
        try {
            const statusBody = req.body;
            console.log('status:' + statusBody);
            const order = await orderModel.findById(statusBody.orderId);
            if (order.paymentMethod == "COD") {
                if (statusBody.status == "Delivered") {
                    await orderModel.findByIdAndUpdate(statusBody.orderId, {
                        $set: {
                            orderStatus: statusBody.status,
                            paymentStatus: "Paid"
                        },
                    });
                } else {
                    await orderModel.findByIdAndUpdate(statusBody.orderId, {
                        $set: {
                            orderStatus: statusBody.status,
                            paymentStatus: "Pending"
                        },
                    });
                }
            } else {
                await orderModel.findByIdAndUpdate(statusBody.orderId, {
                    $set: {
                        orderStatus: statusBody.status
                    },
                });
            }

            res.json(true);
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // VIEW ORDER PAGE
    viewOrder: async (req, res) => {
        try {
            let orderId = req.params.id
            let order = await orderModel.findOne({ _id: orderId }).populate('address')
            let carts = await cartModel.find()
            res.render('admin/view-order', {
                order, carts, dashboard: false, product: false, user: false, category: false,
                subCategory: false, banner: false, news: false, orders: true, coupon: false, sales: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    }
}