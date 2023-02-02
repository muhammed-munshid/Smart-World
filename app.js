/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express=require('express');
const logger=require('morgan');
const path=require('path');
const ejs=require('ejs');
const cookieParser=require('cookie-parser');
const createError=require('http-errors');
const db = require('./config/connection');
const multer=require('multer')
const session=require('express-session');
const mongoose = require('mongoose')
//Routes
const homeRouter=require('./routes/home');
const adminRouter=require('./routes/admin');

const app=express();

app.use((req,res,next)=>{
    res.header('Cache-Control','private,no-cache,no-store,must-revalidate');
    next();
  });

//view engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

// app.use(logger('dev'));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));
db.connect()
app.use(session({secret:"secret",cookie:{maxAge:6000000},saveUninitialized:true,resave:true}))


app.use('/',homeRouter)
app.use('/admin',adminRouter)


const PORT = process.env.PORT || 4000;
app.listen(PORT, console.log("Server started"))