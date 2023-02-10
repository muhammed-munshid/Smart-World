/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { render } = require('ejs')

const userModel = require('../model/user-model')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const { resolve } = require('path')
const wishlistModel = require('../model/wishlist-model')
const productModel = require('../model/product-model')
const categoryModel = require('../model/category-model')
const subCategoryModel = require('../model/sub-category-model')
const { stringify } = require('querystring')
const bannerModel = require('../model/banner-model')
const cartModel = require('../model/cart-model')
const couponModel = require('../model/coupon-model')
const newsModel = require('../model/news-model')
const addressModel = require('../model/address-model')
const orderModel = require('../model/order-model')
const Razorpay = require('razorpay')
const { findOneAndUpdate } = require('../model/user-model')

let instance = new Razorpay({
    key_id: 'rzp_test_WMLYqfRmARx3mG',
    key_secret: 'BlR899sYazh9UinmUx2UeDb5',
});

let Name;
let Email;
let Mobile;
let Password;

// smtp initialising

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',

    auth: {
        user: 'techiemunshid@gmail.com',
        pass: 'lbhegtbknfepkoup',
    }
});

// OTP Generating

let otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);


module.exports = {

    // HOME PAGE
    home: async (req, res) => {
        try {
            let user = req.session.user
            let newses = await newsModel.find()
            let banner = await bannerModel.find()
            let products = await productModel.find({ block: false }).limit(8)
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('home', { user, products, categories, subCategories, banner, newses, home: true, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // LOGIN PAGE
    login: async (req, res) => {
        try {
            let categories = await categoryModel.find()
            res.render('user/login', { categories })
        } catch (error) {
            res.render('user/404-page')
        }

    },

    // LOGIN
    dologin: async (req, res) => {
        try {
            let userData = req.body
            let response = {}
            let user = await userModel.findOne({ $and: [{ Email: userData.email }, { block: false }] })
            if (user) {
                bcrypt.compare(userData.password, user.Password).then((status) => {
                    if (status) {
                        req.session.userId = user.id
                        req.session.user = user.Name
                        res.redirect('/')
                        response.status = true;
                    } else {
                        response.passwordErr = true;
                        res.redirect('/login')
                    }
                })
            } else {
                response.status = false;
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // LOGOUT
    logOut: (req, res) => {
        req.session.destroy()
        res.redirect('/')
    },

    // CART PAGE
    cart: async (req, res) => {
        try {
            if (req.session.userId) {
                let user = req.session.user
                let userId = req.session.userId
                let coupons = await couponModel.find()
                let categories = await categoryModel.find({ delete: false })
                let subCategories = await subCategoryModel.find({ delete: false })
                let carts = await cartModel.findOne({ user_id: userId })
                if (carts) {
                    res.render('user/cart', { user, categories, subCategories, carts, coupons, home: false, shop: false, category: false, brand: false })
                }
                else {
                    res.redirect('/')
                }
            } else {
                res.redirect('/login')
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD CART PAGE
    addCart: async (req, res) => {
        try {
            let products = req.body
            let productId = req.params.id
            let userId = req.session.userId
            let exist = false
            if (products.stock < 1) {
                res.json({ noAvailability: true });
            } else {
                if (req.session.userId) {
                    const cart = await cartModel.findOne({ user_id: userId })
                    if (cart) {
                        const proExist = cart.items
                        proExist.forEach((element) => {
                            let productExist = element.products
                            if (productExist == productId) {
                                exist = true
                            }
                        })
                        if (exist) {
                            res.json({ exist: true })
                        } else {
                            await cartModel.findOneAndUpdate({ user_id: userId }, {
                                $push: {
                                    items:
                                        [{
                                            products: productId,
                                            productImage: products.image,
                                            productPrice: products.price,
                                            productStock: products.stock,
                                            productName: products.name,
                                            totalPrice: products.price
                                        }]
                                }
                            }
                            )
                            await cartModel.updateOne({ user_id: userId }, { $inc: { total: products.price } })
                            res.json({ added: true })
                        }
                    }
                    else {
                        const newCart = new cartModel({
                            user_id: userId,
                            total: products.price,
                            items: [{
                                products: productId,
                                productImage: products.image,
                                productPrice: products.price,
                                productStock: products.stock,
                                productName: products.name,
                                totalPrice: products.price
                            }]
                        })
                        newCart.save()
                            .then(() => {
                                res.json({ added: true })
                            })
                    }
                } else {
                    res.json({ loginErr: true });
                }
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // CART INCREMENT
    plusQantity: async (req, res) => {
        try {
            const _id = req.params.id;
            let stokeNew = await productModel.findOne({ _id: _id })
            let stopStock = stokeNew.stock
            const userId = req.session.userId
            const cartData = await cartModel.findOne({ user_id: userId });
            let productIndex = cartData.items.findIndex(
                (p) => p.products == _id
            );
            let prodId = cartData.items[productIndex]
            let price = prodId.productPrice
            let quantity = prodId.quantity
            if (stopStock > 1) {
                cartData.items[productIndex].quantity += 1;
                cartData.items[productIndex].totalPrice = (quantity + 1) * price;
                var sum = 0;
                for (let i = 0; i < cartData.items.length; i++) {
                    sum = sum + Number(cartData.items[i].totalPrice);
                }
                cartData.total = sum;
                let stoke = await productModel.findOneAndUpdate(
                    { _id: _id },
                    { $inc: { stock: -1 } }
                )
                stoke.save()
                // eslint-disable-next-line no-unused-vars 
                cartData.save().then((success) => {
                    res.json({ status: true });
                });

            } else {
                res.json({ stocklimit: true })
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // CART DECREMENT
    minusQantity: async (req, res) => {
        try {
            const _id = req.params.id;
            const userId = req.session.userId
            const cartData = await cartModel.findOne({ user_id: userId });
            let productIndex = cartData.items.findIndex(
                (p) => p.products == _id
            );
            let prodId = cartData.items[productIndex]
            let price = prodId.productPrice
            let quantity = prodId.quantity
            cartData.items[productIndex].quantity -= 1;
            cartData.items[productIndex].totalPrice = (quantity - 1) * price;
            let cart = cartData.total
            let cartTotal = cart - price
            cartData.total = cartTotal
            let stoke = await productModel.findOneAndUpdate(
                { _id: _id },
                { $inc: { stock: +1 } }
            )
            stoke.save()
            // eslint-disable-next-line no-unused-vars
            cartData.save().then((success) => {
                res.json({ status: true, deleted: true });
            });
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // DELETE CART
    deleteCart: async (req, res) => {
        try {
            let productId = req.params.id
            let userId = req.session.userId
            const cartData = await cartModel.findOne({ user_id: userId });
            let productIndex = cartData.items.findIndex(
                (p) => p.products == productId
            );
            let prodId = cartData.items[productIndex]
            let price = prodId.productPrice
            let total = cartData.total
            let grandTotal = cartData.grandTotal
            const deleteTotal = total - price
            const deleteGrand = grandTotal - price
            if (grandTotal == null) {
                await cartModel.findOneAndUpdate({ user_id: userId }, {
                    $pull: {
                        items:
                        {
                            products: productId
                        }
                    }
                })
                await cartModel.updateOne({ user_id: userId }, {
                    $set: {
                        total: deleteTotal
                    }
                })
                    .then(() => {
                        res.json({ deleted: true })
                    })
            } else {
                await cartModel.findOneAndUpdate({ user_id: userId }, {
                    $set: {
                        total: deleteTotal,
                        grandTotal: deleteGrand,
                        discount: 0
                    },
                    $pull: {
                        items:
                        {
                            products: productId
                        }
                    }
                })
                    .then(() => {
                        res.json({ deleted: true })
                    })
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },





    deleteminusCart: async (req, res) => {
        try {
            let productId = req.params.id
            let userId = req.session.userId
            const cartData = await cartModel.findOne({ user_id: userId });
            let productIndex = cartData.items.findIndex(
                (p) => p.products == productId
            );
            let prodId = cartData.items[productIndex]
            let price = prodId.productPrice
            let total = cartData.total
            const deleteTotal = total - price
            console.log(price);
            console.log(deleteTotal);
            await cartModel.findOneAndUpdate({ user_id: userId }, {
                $pull: {
                    items:
                    {
                        products: productId
                    }
                }
            }).then(() => {
                res.json({ deleted: true })
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // RESET CART
    deleteallCart: async (req, res) => {
        try {
            let cartId = req.params.id
            await cartModel.deleteOne({ _id: cartId })
                .then(() => {
                    res.json({ deleted: true })
                })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // COUPON
    addCoupon: async (req, res) => {
        try {
            let userId = req.session.userId
            let couponCode = req.params.id
            let coupon = await couponModel.findOne({ code: couponCode, is_deleted: false, expiry_date: { $gte: Date.now() } })
            if (coupon) {
                let exist = await couponModel.findOne({ code: couponCode, users: { $in: userId } })
                if (exist) {
                    res.json({ exist: true })
                } else {
                    let cart = await cartModel.findOne({ user_id: userId })
                    let amount = ((cart.total / 100) * coupon.discount).toFixed(0)
                    let grandTotal = cart.total - amount
                    let newCoupon = await cartModel.findOneAndUpdate({ userId }, { $set: { discount: { couponId: coupon._id, amount }, grandTotal } })
                    res.json({ success: true })
                }
            } else {
                res.json({ error: true })
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // WISHLIST PAGE
    wishlist: async (req, res) => {
        try {
            if (req.session.userId) {
                let user = req.session.user
                let userId = req.session.userId
                let categories = await categoryModel.find({ delete: false })
                let subCategories = await subCategoryModel.find({ delete: false })
                let wishlist = await wishlistModel.findOne({ user_id: userId })
                if (wishlist) {
                    res.render('user/wishlist', { user, categories, subCategories, wishlist, home: false, shop: false, category: false, brand: false })
                }
                else {
                    res.redirect('/')
                }
            } else {
                res.redirect('/login')
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD WISHLIST
    addWishlist: async (req, res) => {
        try {
            let products = req.body
            let productId = req.params.id
            let userId = req.session.userId
            let exist = false
            if (req.session.userId) {
                const wishlist = await wishlistModel.findOne({ user_id: userId })
                if (wishlist) {
                    const proExist = wishlist.items
                    proExist.forEach((element) => {
                        let productExist = element.products.valueOf()
                        if (productExist == productId) {
                            exist = true
                        }
                    })
                    if (exist) {
                        res.json({ exist: true })
                    } else {
                        await wishlistModel.findOneAndUpdate({ user_id: userId }, {
                            $push: {
                                items:
                                    [{
                                        products: productId,
                                        productPrice: products.price,
                                        productName: products.name,
                                        productImage: products.image,
                                        productCategory: products.category,
                                    }]
                            }
                        })
                        res.json({ added: true })
                    }
                }
                else {
                    const newWishlist = new wishlistModel({
                        user_id: userId,
                        items: [{
                            products: productId,
                            productPrice: products.price,
                            productName: products.name,
                            productImage: products.image,
                            productCategory: products.category,
                        }]
                    })
                    newWishlist.save()
                        .then(() => {
                            res.json({ added: true })
                        })
                }
            } else {
                res.json({ loginErr: true });
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD CART FROM WISHLIST
    wishtoCart: async (req, res) => {
        try {
            let products = req.body
            let productId = req.params.id
            let userId = req.session.userId
            let exist = false
            if (req.session.userId) {
                const cart = await cartModel.findOne({ user_id: userId })
                if (cart) {
                    const proExist = cart.items
                    proExist.forEach((element) => {
                        let productExist = element.products
                        if (productExist == productId) {
                            exist = true
                        }
                    })
                    if (exist) {
                        res.json({ exist: true })
                    } else {
                        await cartModel.findOneAndUpdate({ user_id: userId }, {
                            $push: {
                                items:
                                    [{
                                        products: productId,
                                        productImage: products.image,
                                        productPrice: products.price,
                                        productName: products.name,
                                        totalPrice: products.price
                                    }]
                            }
                        }
                        )
                        await cartModel.updateOne({ user_id: userId }, { $inc: { total: products.price } })
                        res.json({ added: true })
                    }
                }
                else {
                    const newCart = new cartModel({
                        user_id: userId,
                        total: products.price,
                        items: [{
                            products: productId,
                            productImage: products.image,
                            productPrice: products.price,
                            productName: products.name,
                            totalPrice: products.price
                        }]
                    })
                    newCart.save()
                        .then(() => {
                            res.json({ added: true })
                        })
                }
            } else {
                res.json({ loginErr: true });
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // DELETE WISHLIST OF PRODUCT
    deleteWishlist: async (req, res) => {
        try {
            let productId = req.params.id
            let userId = req.session.userId
            await wishlistModel.findOneAndUpdate({ user_id: userId }, {
                $pull: {
                    items:
                    {
                        products: productId
                    }
                }
            }).then(() => {
                res.json({ deleted: true })
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // SHOP PAGE
    shop: async (req, res) => {
        try {
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            const totalproducts = await productModel.find({ block: false }).countDocuments()
            const page = parseInt(req.query.page) || 1;
            const items_per_page = 9;
            let sort = req.query.sort
            if (sort == 'all') {
                let products = await productModel.find({ block: false }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == 'ascending') {
                let products = await productModel.find({ block: false }).sort({ price: 1 })
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == 'descending') {
                let products = await productModel.find({ block: false }).sort({ price: -1 })
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == '5,000-10,000') {
                let products = await productModel.find({ block: false, price: { $gte: 5000, $lte: 10000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == '10,000-20,000') {
                let products = await productModel.find({ block: false, price: { $gte: 10000, $lte: 20000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == '20,000-40,000') {
                let products = await productModel.find({ block: false, price: { $gte: 20000, $lte: 40000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == '40,000-50,000') {
                let user = req.session.user
                let products = await productModel.find({ block: false, price: { $gte: 40000, $lte: 50000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else if (sort == '50,000+') {
                let user = req.session.user
                let products = await productModel.find({ block: false, price: { $gte: 50000, $lte: 100000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
            else {
                let products = await productModel.find({ block: false }).skip((page - 1) * items_per_page).limit(items_per_page)
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, categoryName: null, brands: null,
                    PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
                })
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // PRODUCT DETAILS
    details: async (req, res) => {
        try {
            let productId = req.params.id
            let user = req.session.user
            let product = await productModel.findOne({ _id: productId })
            let products = await productModel.find().limit(4).skip(1)
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('user/product-details', {
                user, product, products, categories, subCategories, home: false, shop: false, category: false, brand: false
            })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // CATEGORY AND SUB CATEGORY PAGE
    category: async (req, res) => {
        try {
            let brands = req.query.brand
            if (brands) {
                const totalproducts = await productModel.find({ block: false }).countDocuments()
                const page = parseInt(req.query.page) || 1;
                const items_per_page = 9;
                let user = req.session.user
                let categories = await categoryModel.find({ delete: false })
                let subCategories = await subCategoryModel.find({ delete: false })
                let product = await productModel.find().populate('brand').skip((page - 1) * items_per_page).limit(items_per_page)
                let products = []
                product.forEach(item => {
                    if (item?.brand._id == brands) {
                        products.push(item)
                    }
                })
                res.render('user/shop', {
                    user, products, categories, subCategories, page,
                    hasNextPage: items_per_page * page < totalproducts,
                    hasPreviousPage: page > 1, home: false, shop: false, category: false, categoryName: null,
                    brand: true, PreviousPage: page - 1, brands
                })
            }
            else {
                let categoryName = req.params.id
                const totalproducts = await productModel.find({ block: false }).countDocuments()
                const page = parseInt(req.query.page) || 1;
                const items_per_page = 9;
                let user = req.session.user
                let products = await productModel.find({ category: categoryName }).skip((page - 1) * items_per_page).limit(items_per_page)
                let categories = await categoryModel.find({ delete: false })
                let subCategories = await subCategoryModel.find({ delete: false })
                res.render('user/shop', {
                    user, products, categories, subCategories, page, categoryName,
                    hasNextPage: items_per_page * page < totalproducts, brands: null,
                    hasPreviousPage: page > 1, home: false, shop: false, category: true,
                    brand: false, PreviousPage: page - 1
                })
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // CHECKOUT PAGE
    checkout: async (req, res) => {
        try {
            let user = req.session.user
            let userId = req.session.userId
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            let carts = await cartModel.findOne({ user_id: userId })
            let address = await addressModel.find()
            res.render('user/checkout', { user, categories, userId, subCategories, carts, address, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // APPLY CHECKOUT
    doCheckout: async (req, res) => {
        try {
            let userId = req.session.userId
            let carts = await cartModel.findOne({ user_id: userId })
            let orders = req.body
            let products = carts.items
            let paymentStatus = orders['payment-method'] === 'COD' ? 'Pending' : 'Paid'
            let orderStatus = orders['payment-method'] === 'COD' ? 'Processing' : 'Pending'
            const newOrder = new orderModel({
                user_id: userId,
                paymentMethod: orders['payment-method'],
                products: products,
                address: orders.address,
                discount: carts.discount.amount,
                grandTotal: carts.grandTotal,
                total: carts.total,
                paymentStatus: paymentStatus,
                orderStatus: orderStatus,
                date: new Date(),
                time: new Date().toLocaleTimeString()
            })
            newOrder.save()
                // eslint-disable-next-line no-unused-vars
                .then(async (success) => {
                    products.forEach(async (el) => {
                        await productModel.findOneAndUpdate(
                            { _id: el.products },
                            { $inc: { stock: -el.quantity } }
                        );
                    });
                    if (req.body['payment-method'] == 'COD') {
                        await cartModel.deleteOne({ user_id: userId })
                        res.json({ status: true })
                    } else if (req.body['payment-method'] == 'online') {
                        let orderId = newOrder._id.valueOf()
                        let userId = req.session.userId
                        let user = await userModel.findOne({ _id: userId })
                        await cartModel.deleteOne({ user_id: userId })
                        let totalPrice = newOrder.total
                        let grandTotal = newOrder.grandTotal
                        if (grandTotal == null) {
                            let options = {
                                amount: totalPrice * 100,
                                currency: "INR",
                                receipt: orderId
                            }
                            instance.orders.create(options, (err, order) => {
                                if (err) {
                                    console.log(err);
                                }
                                res.json({ order, user })
                            })
                        } else {
                            let options = {
                                amount: grandTotal * 100,
                                currency: "INR",
                                receipt: orderId
                            }
                            instance.orders.create(options, (err, order) => {
                                if (err) {
                                    console.log(err);
                                }
                                res.json({ order, user })
                            })
                        }
                    } else if (req.body['payment-method'] == 'wallet') {
                        let user = await userModel.findOne({ _id: userId })
                        let order = await orderModel.findOne({ user_id: userId })
                        let carts = await cartModel.findOne({ user_id: userId })
                        let orderId = order._id
                        let total = carts.total
                        let grandTotal = carts.grandTotal
                        let walletAmount = user.walletAmount
                        if (walletAmount == 0) {
                            res.json({ zeroWallet: true })
                        } else {
                            if (grandTotal == null) {
                                await cartModel.deleteOne({ user_id: userId })
                                if (walletAmount < total) {
                                    const balancePayment = total - walletAmount
                                    orderId = newOrder._id.valueOf()
                                    let options = {
                                        amount: balancePayment * 100,
                                        currency: "INR",
                                        receipt: orderId
                                    }
                                    instance.orders.create(options, (err, order) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        res.json({ order, user })
                                    })
                                } else {
                                    const balanceWallet = walletAmount - total
                                    await userModel.findOneAndUpdate({ _id: userId }, {
                                        $set: {
                                            walletAmount: balanceWallet
                                        }
                                    }).then(() => {
                                        res.json({ status: true })
                                    })
                                }
                            } else {
                                await cartModel.deleteOne({ user_id: userId })
                                if (walletAmount < grandTotal) {
                                    const balancePayment = grandTotal - walletAmount
                                    orderId = newOrder._id.valueOf()
                                    let options = {
                                        amount: balancePayment * 100,
                                        currency: "INR",
                                        receipt: orderId
                                    }
                                    instance.orders.create(options, (err, order) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        res.json({ order, user })
                                    })
                                } else {
                                    const balanceWallet = walletAmount - grandTotal
                                    await userModel.findOneAndUpdate({ _id: userId }, {
                                        $set: {
                                            walletAmount: balanceWallet
                                        }
                                    }).then(() => {
                                        res.json({ status: true })
                                    })
                                }
                            }
                        }
                    } else {
                        res.json({ noSelect: true })
                    }
                })
        }
        catch (error) {
            res.render('user/404-page')
        }
    },

    // ADDRESS PAGE IN CHECKOUT
    address: async (req, res) => {
        try {
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('user/add-address', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD ADDRESS PAGE IN CHECKOUT
    addAddress: (req, res) => {
        try {
            let orders = req.body
            const { first_name, last_name, phone, address, address2, pincode, town, state, country, email, notes } = orders
            new addressModel({
                First_Name: first_name,
                Last_Name: last_name,
                Mobile: phone,
                Address: address,
                Address2: address2,
                Pincode: pincode,
                Town: town,
                State: state,
                Country: country,
                Email: email,
                Notes: notes,
            }).save()
            res.redirect('/checkout')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // VERIFY PAYMENT
    verifyPayment: async (req, res) => {
        try {
            let userId = req.session.userId
            let details = req.body
            let orderId = req.body.order.order.receipt
            // eslint-disable-next-line no-undef
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'BlR899sYazh9UinmUx2UeDb5')
            hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
            hmac = hmac.digest('hex')
            let walletAmount = await userModel.findOne({ _id: userId })
            if (walletAmount == null) {
                if (hmac == details.payment.razorpay_signature) {
                    await orderModel.updateOne({ _id: orderId }, {
                        $set: {
                            orderStatus: 'Processing',
                            orderPayment: 'Paid'
                        }
                    }).then(() => {
                        res.json({ status: true })
                    }).catch((err) => {
                        console.log(err);
                        res.json({ status: false, errMsg: '' })
                    })
                }
            } else {
                if (hmac == details.payment.razorpay_signature) {
                    await orderModel.updateOne({ _id: orderId }, {
                        $set: {
                            orderStatus: 'Processing',
                            orderPayment: 'Paid'
                        }
                    })
                    await userModel.updateOne({ _id: userId }, {
                        $set: {
                            walletAmount: 0
                        }
                    })
                        .then(() => {
                            res.json({ status: true })
                        }).catch((err) => {
                            console.log(err);
                            res.json({ status: false, errMsg: '' })
                        })
                }
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ORDER SUCCESS PAGE
    orderSuccess: async (req, res) => {
        try {
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('user/order-success', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ORDER FAILURE PAGE
    orderFailed: async (req, res) => {
        try {
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('user/order-failed', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ORDER PRODUCT DETAILS
    orderProducts: async (req, res) => {
        try {
            let orderProducts = req.params.id
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            let order = await orderModel.findOne({ _id: orderProducts }).populate('address')
            res.render('user/order-products', { user, categories, subCategories, order, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // CANCEL ORDER
    cancelOrder: async (req, res) => {
        try {
            const orderId = req.params.id;
            console.log(orderId);
            await orderModel.findByIdAndUpdate(
                { _id: orderId },
                { $set: { orderStatus: "Cancelled" } }
            );
            res.redirect("/profile-orders");
        } catch (error) {
            res.render('user/404-page')
        }
    },

    returnOrder: async (req, res) => {
        try {
            const orderId = req.params.id;
            const userId = req.session.userId
            let orders = await orderModel.findOne({ _id: orderId })
            let userWallet = await userModel.findOne({ _id: userId })
            let walletAmount = userWallet.walletAmount
            let totalAmount = orders.total
            let grandAmount = orders.grandTotal
            let totalWallet = totalAmount + walletAmount
            let grandWallet = grandAmount + walletAmount
            await orderModel.findByIdAndUpdate(
                { _id: orderId },
                {
                    $set:
                    {
                        orderStatus: "returned",
                        paymentStatus: "refund success"
                    }
                }
            )
            if (grandAmount == null) {
                await userModel.findOneAndUpdate({ _id: userId }, {
                    $set: {
                        walletAmount: totalWallet
                    }
                }).then(() => {
                    res.json({ return: true })
                })
            } else {
                await userModel.findOneAndUpdate({ _id: userId }, {
                    $set: {
                        walletAmount: grandWallet
                    }
                }).then(() => {
                    res.json({ return: true })
                })
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // SIGN UP PAGE
    signUp: (req, res) => {
        try {
            res.render('user/signup')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // OTP PAGE
    otp: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            res.render('user/otp', { otpErr: false, categories })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // SIGN UP
    dosignUp: async (req, res) => {
        try {
            Name = req.body.name
            Email = req.body.email
            Mobile = req.body.mobile
            Password = req.body.password
            const user = await userModel.findOne({ Email: Email });
            let categories = await categoryModel.find({ delete: false })
            if (!user) {
                // mail content
                let mailOptions = {
                    to: req.body.email,
                    subject: "Otp for registration is: ",
                    html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body

                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        return console.log(error);
                    }
                    res.render('user/otp', { otpErr: false, categories });
                });
            }
            else {
                res.redirect('/login');
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    //verifiation
    verifyOtp: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            if (req.body.otp == otp) {
                const newUser = userModel(
                    {
                        Name: Name,
                        Email: Email,
                        Mobile: Mobile,
                        Password: Password
                    }
                );
                bcrypt.hash(newUser.Password, 10, (err, hash) => {
                    if (err) throw err;
                    newUser.Password = hash;
                    newUser
                        .save()
                        .then(() => {
                            res.redirect("/login");
                        })
                        .catch((err) => {
                            console.log(err);
                            res.redirect("/login")
                        })

                })
            }
            else {
                res.render('user/otp', { otpErr: true, categories });
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    //resending
    resendOtp: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            let mailOptions = {
                to: Email,
                subject: "Otp for registration is: ",
                html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    return console.log(error);
                }
                res.render('user/otp', { otpErr: false, categories });
            });
        } catch (error) {
            res.render('user/404-page')
        }
    },

    resetresendOtp: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            let mailOptions = {
                to: Email,
                subject: "Otp for registration is: ",
                html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    return console.log(error);
                }
                res.render('user/reset-otp', { categories });
            });
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EMAIL PAGE
    email: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            res.render('user/email', { categories })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // SEND EMAIL
    sendEmail: async (req, res) => {
        try {
            Email = req.body.email
            const user = await userModel.findOne({ Email: Email });
            const categories = await categoryModel.find({ delete: false })
            if (user) {
                // mail content
                let mailOptions = {
                    to: req.body.email,
                    subject: "Otp for registration is: ",
                    html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        return console.log(error);
                    }
                    res.render('user/reset-otp', { categories });
                });
            }
            else {
                res.redirect('/login');
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    //verifiation
    verifyresetOtp: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            if (req.body.otp == otp) {
                res.render('user/reset', { categories })
            }
            else {
                res.redirect('/reset-otp');
            }
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // RESET PAGE
    reset: async (req, res) => {
        try {
            let categories = await categoryModel.find({ delete: false })
            res.render('user/reset', { categories })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // RESET PASSWORD
    resetPassword: async (req, res) => {
        try {
            let user = req.body
            let Email = user.email
            let Password = user.password
            Password = await bcrypt.hash(Password, 10)
            await userModel.updateOne({ Email: Email }, { $set: { Password: Password } });
            res.redirect('/login')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    //  NEWS PAGE
    news: async (req, res) => {
        try {
            let user = req.session.user
            let newsId = req.params.id
            let news = await newsModel.findOne({ _id: newsId })
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('user/news', { user, categories, subCategories, news, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // SEARCH PAGE
    search: async (req, res) => {
        try {
            const searchQuery = req.body.search
            const search = await productModel.find({ name: { $regex: searchQuery, '$options': 'i' } })
            let user = req.session.user
            let products = await productModel.find()
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            const searchlen = search.length
            res.render('user/search', { userId: true, search, searchQuery, searchlen, user, products, categories, subCategories, home: false, shop: false, category: false, brand: false, categoryName: null, brands: null })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // PROFILE PAGE
    profile: async (req, res) => {
        try {
            let userId = req.session.userId
            let userDetails = await userModel.findOne({ _id: userId })
            res.render('user/profile', { userDetails })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT PROFILE PAGE
    editProfile: async (req, res) => {
        try {
            let userId = req.params.id
            let user = await userModel.find({ _id: userId })
            let categories = await categoryModel.find({ delete: false })
            let profile = user[0]
            res.render('user/edit-profile', { profile, categories })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // EDIT PROFILE
    updateProfile: async (req, res) => {
        try {
            let userId = req.params.id
            let userData = req.body
            await userModel.updateMany({ _id: userId }, {
                $set: {
                    Name: userData.name,
                    Email: userData.email,
                    Mobile: userData.Mobile
                }
            })
            res.redirect('/profile')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD ADDRESS PAGE IN PROFILE PAGE
    addprofileAddress: async (req, res) => {
        try {
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('user/add-prof-address', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // ADD ADDRESS IN PROFILE PAGE
    doaddprofileAddress: async (req, res) => {
        try {
            let addressData = req.body
            const { first_name, last_name, phone, address, address2, pincode, town, state, country, email, notes } = addressData
            const newAddress = await addressModel({
                First_Name: first_name,
                Last_Name: last_name,
                Mobile: phone,
                Address: address,
                Address2: address2,
                Pincode: pincode,
                Town: town,
                State: state,
                Country: country,
                Email: email,
                Notes: notes
            })
            newAddress.save()
            res.redirect('/profile')
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // VIEW ADDRESS IN PROFILE PAGE
    profileAddress: async (req, res) => {
        try {
            let user = req.session.user
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            let profAddress = await addressModel.find()
            res.render('user/profile-address', { user, categories, subCategories, profAddress, home: false, shop: false, category: false, brand: false })
        } catch (error) {
            res.render('user/404-page')
        }
    },

    // VIEW ORDERS IN PROFILE PAGE
    profileOrders: async (req, res) => {
        try {
            let orders = await orderModel.find().populate('address').sort({ date: -1 })
            res.render('user/profile-orders', { orders })
        } catch (error) {
            res.render('user/404-page')
        }
    },
}