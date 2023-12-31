require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const User = require('./models/user')

const indexRouter = require('./routes/index')
const messageRouter = require('./routes/messages')
const usersRouter = require('./routes/users')

const app = express()

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
connectDB().catch((err) => console.log(err))
async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI)
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }))

// TODO Remove loggers

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (username, password, done) => {
    console.log('New Local Strategy')
    try {
      const user = await User.findOne({ email: username })
      if (!user) {
        console.log('Incorrect username')
        return done(null, false, { message: 'Email address not found' })
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        console.log('Incorrect password')
        return done(null, false, { message: 'Incorrect password' })
      }
      console.log('Found user')
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

app.use(passport.initialize())
app.use(passport.session())

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
  console.log('USER: ' + req.user)
  res.locals.currentUser = req.user
  next()
})

app.use('/', indexRouter)
app.use('/messages', messageRouter)
app.use('/users', usersRouter)

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
