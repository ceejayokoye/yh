if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  
  const express = require('express')
  const app = express()
  const bcrypt = require('bcrypt')
  const passport = require('passport')   
  const flash = require('express-flash')
  const session = require('express-session')  
  const methodOverride = require('method-override')  
  const path = require('path')
  const mysql = require('mysql')
  const bodyParser = require('body-parser')
 
 const connection= mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: 'Starboy4life',
   database: 'utensilstore'
 })


  const initializePassport = require('./passport-config')
const { match } = require('assert')
const { log, Console, error } = require('console')
  // initializePassport(
  //   passport,
  //   email => users.find(user => user.email === email),
  //   id => users.find(user => user.id === id)
  // )
   
  

  app.set('view-engine', 'ejs')
  
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(express.json())
  app.use(express.static(path.join(__dirname,'views')))
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,  
    saveUninitialized: true
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))    
  
  app.get('/', checkAuthenticated, (req, res) => {
   
    res.sendFile(path.join(__dirname, 'views','favicon_io' ));  
    
  })  
   
  app.get('/login', checkNotAuthenticated, (req, res) => {
    const errorMessage = req.flash('error') 
    res.render('login.ejs',{ error:errorMessage})
  })
  app.get('/payment',(req,res)=>{
    res.sendFile(path.join(__dirname,'views','payment.html'))
    console.log('yh');
  })
  
  app.get('/orders', checkNotAuthenticated, (req, res) => {
    
    const query = 'SELECT * FROM comments ORDER BY timestamp DESC';
    connection.query(query,(err,results)=>{
      if (err) throw err;
      res.render('orders.ejs',{comments:results})
    }) 
  })
  app.get('/inbox', checkNotAuthenticated, (req, res) => {
    res.render('inbox.ejs')
  })
  
  app.get('/reviews', checkNotAuthenticated, (req, res) => {
    const query = 'SELECT * FROM comments ORDER BY timestamp DESC';
    connection.query(query,(err,results)=>{
      if (err) throw err;
      res.render('reviews.ejs',{comments:results})
    })
  })

  
     app.post('/login',checkNotAuthenticated,(req,res)=>{
      const {email,password} = req.body;

      const sql = 'SELECT * FROM users WHERE username = ?';
      
      
      connection.query(sql,[email], (err,result)=>{
        console.log(result);
        if (err) throw err;
        if (result.length > 0) {
          const hashedPassword = result[0].password;
          bcrypt.compare(password,hashedPassword,(err,match)=>{
            if (err) throw err;
            if (match) {
              console.log('sussessful');
              res.redirect('/')
            } else{
              req.flash('error','password is incorrect')
              console.log('password incorrect');
              res.redirect('/login')
            }  
          });    
        } else{
          req.flash('error','username unavailable')
          console.log('username not in database');
          res.redirect('/login')
        }
      })
     }) 
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    const errorMessage = req.flash('error')
    res.render('register.ejs',{ error:errorMessage})
  })
    
  app.post('/register', checkNotAuthenticated, async (req, res) => {
  const{email, password,address} = req.body;
    if (email && password && address ) {
      bcrypt.hash(password,10,(err, hashedPassword)=>{
      
        const checkuser = 'SELECT * FROM users WHERE username =?';
        const sql = 'INSERT INTO users (username,password,address) VALUES (?,?,?)';
        connection.query(checkuser,[email],(err,result)=>{
          if (err) throw err;
          if (result.length > 0) {
           req.flash('error','username already exist')
           res.redirect('/register')
          } else{
            connection.query(sql,[email,hashedPassword,address],(err,result)=>{
              console.log('registered');
              res.redirect('/login')
            });  
          }
        })
        
      });
    } else{
      req.flash('error','empty forms')
      res.redirect('/register')
    }
        
             
  });

  //sidebar
  app.post('/comment',(req,res)=>{  
    const{name,product,comment} = req.body
  const query = 'INSERT INTO comments(name,product,comment,timestamp) VALUES(?,?,?, NOW())';
  connection.query(query,[name,product,comment],(err,results)=>{
    if (err) throw err;
    res.redirect('/reviews')
       
  })   
  })   
  
  app.get('/logout', (req, res) => { 
    req.session.destroy((err)=>{
      if (err) {
        console.log(err);
      }
      else{
        res.redirect('/login')
      }
    });
  });  
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated())  {
      return next()
    }    
  
    res.redirect('/login')
  }             
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()   
  } 
   
  app.listen(3004)  