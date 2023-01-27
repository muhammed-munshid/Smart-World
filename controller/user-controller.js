const { render } = require('ejs')
const userModel = require('../model/user-model')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const userAuthHelpers = require('../helpers/userAuth-helpers')
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
            let user = req.session.user
            let newses = await newsModel.find()
            let banner = await bannerModel.find()
            let products = await productModel.find({ block: false }).limit(8)
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            res.render('home', { user, products, categories, subCategories, banner, newses, home: true, shop: false, category: false, brand: false })
    },

    // LOGIN PAGE
    login: async (req, res) => {
            let categories = await categoryModel.find()
            res.render('user/login', { categories})
            
    },

    // LOGIN
    dologin: (req, res) => {
        userAuthHelpers.doLogin(req.body).then(async (response) => {
            if (response.status) {
                req.session.userId = response.user.id
                req.session.user = response.user.Name
                res.redirect('/')
            }
            else {
                res.redirect('/login')
            }

        })
    },

    // LOGOUT
    logOut: (req, res) => {
        req.session.destroy()
        res.redirect('/')
    },

    // CART PAGE
    cart: async (req, res) => {
        if (req.session.userId) {
            let user = req.session.user
            let userId = req.session.userId
            let coupons = await couponModel.find()
            let categories = await categoryModel.find({ delete: false })
            let subCategories = await subCategoryModel.find({ delete: false })
            let carts = await cartModel.findOne({ user_id: userId })
            if (carts) {
                    res.render('user/cart', {  user, categories, subCategories, carts, coupons, home: false, shop: false, category: false, brand: false })
            }
            else {
                res.redirect('/')
            }
        } else {
            res.redirect('/login')
        }
    },

    // ADD CART PAGE
    addCart: async (req, res) => {
        let products = req.body
        let productId = req.params.id
        let userId = req.session.userId
        let exist = false
        if (req.session.userId) {
            const cart = await cartModel.findOne({ userId })
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
                    await cartModel.findOneAndUpdate({ userId: userId }, {
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
    },

    // CART INCREMENT
    plusQantity: async (req, res) => {
        const _id = req.params.id;
        const userId = req.session.userId
        const cartData = await cartModel.findOne({ user_id: userId });
        let productIndex = cartData.items.findIndex(
            (p) => p.products == _id
        );
        let prodId = cartData.items[productIndex]
        let price = prodId.productPrice
        let quantity = prodId.quantity
        cartData.items[productIndex].quantity += 1;
        cartData.items[productIndex].totalPrice = (quantity + 1) * price;
        var sum = 0;
        for (let i = 0; i < cartData.items.length; i++) {
            sum = sum + Number(cartData.items[i].totalPrice);
        }
        cartData.total = sum;
        cartData.save().then((data) => {
            res.json({ status: true });
        });
    },

    // CART DECREMENT
    minusQantity: async (req, res) => {
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
        cartData.save().then((data) => {
            res.json({ status: true, deleted: true });
        });
    },

    // DELETE CART
    deleteCart: async (req, res) => {
        let productId = req.params.id
        let userId = req.session.userId
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
    },

    // RESET CART
    deleteallCart: async (req, res) => {
        let cartId = req.params.id
        let userId = req.session.userId
        await cartModel.deleteOne({ _id: cartId })
            .then(() => {
                res.json({ deleted: true })
            })
    },

    // COUPON
    addCoupon: async (req, res) => {
        let userId = req.session.userId
        let couponCode = req.params.id
        let coupon = await couponModel.findOne({ code: couponCode, is_deleted:false, expiry_date:{$gte:Date.now()} })
        console.log(coupon);
                if (coupon) {
                    let exist = await couponModel.findOne({code:couponCode, users: { $in: userId } })
                    console.log('existtt'+exist);
                    if(exist){
                        res.json({exist:true})
                    }else{
                            let cart = await cartModel.findOne({ user_id: userId })
                            let amount = ((cart.total / 100) * coupon.discount).toFixed(0)
                            let grandTotal = cart.total - amount
                            console.log(grandTotal);
                            let newCoupon = await cartModel.findOneAndUpdate({ userId }, { $set: { discount: { couponId: coupon._id, amount }, grandTotal } })
                            console.log(newCoupon);
                            res.json({success:true})
                    }
                } else {
                    res.json({error:true})
                }
    },

    // WISHLIST PAGE
    wishlist: async (req, res) => {
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
    },

    // ADD WISHLIST
    addWishlist: async (req, res) => {
        let products = req.body
        let productId = req.params.id
        let userId = req.session.userId
        let exist = false
        if (req.session.userId) {
            const wishlist = await wishlistModel.findOne({ userId })
            if (wishlist) {
                const proExist = wishlist.items
                proExist.forEach((element, index, array) => {
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
    },

    // ADD CART FROM WISHLIST
    wishtoCart: async (req, res) => {
        let products = req.body
        let productId = req.params.id
        let userId = req.session.userId
        let exist = false
        if (req.session.userId) {
            const cart = await cartModel.findOne({ userId })
            if (cart) {
                const proExist = cart.items
                proExist.forEach((element, index, array) => {
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
                    await cartModel.updateOne({ userId: userId }, { $inc: { total: products.price } })
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
                        productName: products.name
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
    },

    // DELETE WISHLIST OF PRODUCT
    deleteWishlist: async (req, res) => {
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
    },

    // SHOP PAGE
    shop: async (req, res) => {
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        const totalproducts = await productModel.find({ block: false }).countDocuments()
        const page = parseInt(req.query.page) || 1;
        const items_per_page = 9;
        let sort = req.query.sort
        if (sort == 'all') {
            products = await productModel.find({ block: false }).skip((page - 1) * items_per_page).limit(items_per_page)
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == 'ascending') {
            products = await productModel.find({ block: false }).sort({ price: 1 })
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == 'descending') {
            products = await productModel.find({ block: false }).sort({ price: -1 })
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == '5,000-10,000') {
            products = await productModel.find({ block: false, price: { $gte: 5000, $lte: 10000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == '10,000-20,000') {
            products = await productModel.find({ block: false, price: { $gte: 10000, $lte: 20000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == '20,000-40,000') {
            products = await productModel.find({ block: false, price: { $gte: 20000, $lte: 40000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == '40,000-50,000') {
            let user = req.session.user
            products = await productModel.find({ block: false, price: { $gte: 40000, $lte: 50000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
            res.render('user/shop', {
                user, products, categories, subCategories, page,
                hasNextPage: items_per_page * page < totalproducts,
                hasPreviousPage: page > 1, categoryName: null, brands: null,
                PreviousPage: page - 1, shop: true, home: false, category: false, brand: false
            })
        }
        else if (sort == '50,000+') {
            let user = req.session.user
            products = await productModel.find({ block: false, price: { $gte: 50000, $lte: 100000 } }).skip((page - 1) * items_per_page).limit(items_per_page)
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
    },

    // PRODUCT DETAILS
    details: async (req, res) => {
        let productId = req.params.id
        let user = req.session.user
        let product = await productModel.findOne({ _id: productId })
        let products = await productModel.find().limit(4).skip(1)
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        res.render('user/product-details', {
            user, product, products, categories, subCategories, home: false, shop: false, category: false, brand: false
        })
    },

    // CATEGORY AND SUB CATEGORY PAGE
    category: async (req, res) => {
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
    },

    // CHECKOUT PAGE
    checkout: async (req, res) => {
        let user = req.session.user
        let userId = req.session.userId
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        let carts = await cartModel.findOne({ user_id: userId })
        let address = await addressModel.find()
        res.render('user/checkout', { user, categories, userId, subCategories, carts, address, home: false, shop: false, category: false, brand: false })
    },

    // APPLY CHECKOUT
    doCheckout: async (req, res) => {
        let userId = req.session.userId
        let carts = await cartModel.findOne({ user_id: userId })
        let orders = req.body
        let products = carts.items
        let status = orders['payment-method'] === 'COD' ? 'placed' : 'pending'
        const newOrder = new orderModel({
            user_id: userId,
            paymentMethod: orders['payment-method'],
            products: products,
            address: orders.address,
            discount:carts.discount.amount,
            grandTotal: carts.grandTotal,
            total: carts.total,
            status: status,
            date: new Date()
        })
        newOrder.save()
            .then(async (success) => {
                await cartModel.deleteOne({ user_id: userId })
                if (req.body['payment-method'] == 'COD') {
                    res.json({ status: true })
                } else {
                    let orderId = newOrder._id.valueOf()
                    let userId = req.session.userId
                    let user = await userModel.findOne({ _id: userId })
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
                }
            })
    },

    // ADDRESS PAGE IN CHECKOUT
    address: async (req, res) => {
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        res.render('user/add-address', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
    },

    // ADD ADDRESS PAGE IN CHECKOUT
    addAddress: (req, res) => {
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
    },

    // VERIFY PAYMENT
    verifyPayment: async (req, res) => {
        let details = req.body
        let orderId = req.body.order.order.receipt
        const crypto = require('crypto')
        let hmac = crypto.createHmac('sha256', 'BlR899sYazh9UinmUx2UeDb5')
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
        hmac = hmac.digest('hex')
        if (hmac == details.payment.razorpay_signature) {
            await orderModel.updateOne({ _id: orderId }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {
                res.json({ status: true })
            }).catch((err) => {
                console.log(err);
                res.json({ status: false, errMsg: '' })
            })
        } else {

        }
    },

    // ORDER SUCCESS PAGE
    orderSuccess: async (req, res) => {
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        res.render('user/order-success', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
    },

    // ORDER FAILURE PAGE
    orderFailed: async (req, res) => {
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        res.render('user/order-failed', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
    },

    // ORDER PRODUCT DETAILS
    orderProducts: async (req, res) => {
        let orderProducts = req.params.id
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        let order = await orderModel.findOne({ _id: orderProducts }).populate('address')
        res.render('user/order-products', { user, categories, subCategories, order, home: false, shop: false, category: false, brand: false })
    },

    // SIGN UP PAGE
    signUp: (req, res) => {
        res.render('user/signup')
    },

    // OTP PAGE
    otp: (req, res) => {
        res.render('user/otp', { otpErr: false })
    },

    // SIGN UP
    dosignUp: async (req, res) => {
        Name = req.body.name
        Email = req.body.email
        Mobile = req.body.mobile
        Password = req.body.password
        const user = await userModel.findOne({ Email: Email });
        if (!user) {
            // mail content
            let mailOptions = {
                to: req.body.email,
                subject: "Otp for registration is: ",
                html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body

            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                res.render('user/otp', { otpErr: false });
            });
        }
        else {
            res.redirect('/login');
        }
    },

    //verifiation
    verifyOtp: (req, res) => {
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
                        res.redirect("/login")
                    })

            })
        }
        else {
            res.render('user/otp', { otpErr: true });
        }
    },

    //resending
    resendOtp: (req, res) => {
        let mailOptions = {
            to: Email,
            subject: "Otp for registration is: ",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            res.render('user/otp', { otpErr: false });
        });


    },

    // EMAIL PAGE
    email: (req, res) => {
        res.render('user/email')
    },

    // SEND EMAIL
    sendEmail: async (req, res) => {
        Email = req.body.email
        const user = await userModel.findOne({ Email: Email });
        if (user) {
            // mail content
            let mailOptions = {
                to: req.body.email,
                subject: "Otp for registration is: ",
                html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                res.render('user/reset-otp');
            });
        }
        else {
            res.render('user/login');
        }
    },

    //verifiation
    resetverifyOtp: (req, res) => {
        if (req.body.otp == otp) {
            res.render('user/reset')
        }
        else {
            res.render('user/reset-otp');
        }
    },

    // RESET PAGE
    reset: (req, res) => {
        res.render('user/reset')
    },

    // RESET PASSWORD
    resetPassword: async (req, res) => {
        const user = req.body
        const Email = req.body.email
        let Password = req.body.password
        Password = await bcrypt.hash(Password, 10)
        let userPassword = userModel.findOne({ Password: Password })
        await userModel.updateOne({ Email: Email }, { $set: { Password: Password } });
        res.redirect('/login')
    },

    //  NEWS PAGE
    news: async (req, res) => {
        let user = req.session.user
        let newsId = req.params.id
        let news = await newsModel.findOne({ _id: newsId })
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        res.render('user/news', { user, categories, subCategories, news, home: false, shop: false, category: false, brand: false })
    },

    // SEARCH PAGE
    search: async (req, res) => {
        const searchQuery = req.body.search
        const search = await productModel.find({ name: { $regex: searchQuery, '$options': 'i' } })
        let user = req.session.user
        let products = await productModel.find()
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        const searchlen = search.length
        res.render('user/search', { userId: true, search, searchQuery, searchlen, user, products, categories, subCategories, home: false, shop: false, category: false, brand: false, categoryName: null, brands: null })
    },

    // PROFILE PAGE
    profile: async (req, res) => {
        let userId = req.session.userId
        let userDetails = await userModel.findOne({ _id: userId })
        res.render('user/profile', { userDetails })
    },

    // EDIT PROFILE PAGE
    editProfile: async (req, res) => {
        let userId = req.params.id
        let user = await userModel.find({ _id: userId })
        let categories = await categoryModel.find({ delete: false })
        let profile = user[0]
        res.render('user/edit-profile', { profile, categories })
    },

    // EDIT PROFILE
    updateProfile: async (req, res) => {
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
    },

    // ADD ADDRESS PAGE IN PROFILE PAGE
    addprofileAddress: async (req, res) => {
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        res.render('user/add-prof-address', { user, categories, subCategories, home: false, shop: false, category: false, brand: false })
    },

    // ADD ADDRESS IN PROFILE PAGE
    doaddprofileAddress: async (req, res) => {
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
    },

    // VIEW ADDRESS IN PROFILE PAGE
    profileAddress: async (req, res) => {
        let user = req.session.user
        let categories = await categoryModel.find({ delete: false })
        let subCategories = await subCategoryModel.find({ delete: false })
        let profAddress = await addressModel.find()
        res.render('user/profile-address', { user, categories, subCategories, profAddress, home: false, shop: false, category: false, brand: false })
    },

    // VIEW ORDERS IN PROFILE PAGE
    profileOrders: async (req, res) => {
        let orders = await orderModel.find().populate('address')
        res.render('user/profile-orders', { orders })
    }
}