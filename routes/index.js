const express = require('express')
const router = express.Router()
const passport = require('../config/passport')
const admin = require('./modules/admin')

const userController = require('../controllers/user-controller')
const tweetController = require('../controllers/tweet-controller')
const followshipController = require('../controllers/followship-controller')

const { authenticated } = require('../middleware/auth')
const { generalErrorHandler } = require('../middleware/error-handler')

router.use('/admin', admin)

router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)
router.get('/signin', userController.signInPage)
router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
router.get('/logout', authenticated, userController.logout)
router.get('/settings', authenticated, userController.getSetting)
router.put('/settings', authenticated, userController.putSetting)

router.get('/users/:id/tweets', authenticated, userController.getUserTweets)
router.get('/users/:id/replies', authenticated, userController.getUserReplies)
router.get('/users/:id/followings', authenticated, userController.getUserFollowings)
router.get('/users/:id/followers', authenticated, userController.getUserFollowers)
router.get('/users/:id/likes', authenticated, userController.getUserLikes)
router.put('/users/:id/setup_profile', authenticated, userController.putProfile)

router.post('/tweets/:id/like', authenticated, tweetController.postLike)
router.post('/tweets/:id/unlike', authenticated, tweetController.postUnlike)
router.post('/tweets/:id/replies', authenticated, tweetController.postReply)
router.get('/tweets/:id', authenticated, tweetController.getTweet)
router.get('/tweets', authenticated, tweetController.getIndex)
router.post('/tweets', authenticated, tweetController.postTweet)

router.delete('/followships/:id', authenticated, followshipController.deleteFollowships)
router.post('/followships', authenticated, followshipController.postFollowships)

router.get('/', (req, res) => res.redirect('/signin'))
router.use('/', generalErrorHandler)

module.exports = router
