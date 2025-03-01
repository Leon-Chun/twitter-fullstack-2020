const helpers = require('../_helpers')
const { Like, Reply, Tweet, User } = require('../models')
const tweetController = {
  getIndex: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    return Promise.all([
      Tweet.findAll({
        include: [{
          model: User,
          attributes: {
            exclude: ['password']
          }
        }],
        order: [['createdAt', 'desc'], ['id', 'desc']],
        raw: true,
        nest: true
      }),
      User.findAll({
        include: [{ model: User, as: 'Followers' }],
        where: { role: 'user' }
      }),
      Like.findAll({
        attributes: ['id', 'UserId', 'TweetId'],
        raw: true,
        nest: true
      }),
      Reply.findAll({
        attributes: ['id', 'UserId', 'TweetId'],
        raw: true,
        nest: true
      })
    ])
      .then(([tweets, users, likes, replies]) => {
        const result = users
          .map(user => ({
            ...user.toJSON(),
            followerCount: user.Followers.length,
            isFollowed: user.Followers.some(follower => follower.id === currentUser.id),
            isCurrentUser: user.id === currentUser.id
          }))
          .sort((a, b) => b.followerCount - a.followerCount)
        const newTweets = tweets.map(tweet => ({
          ...tweet,
          isLiked: likes.some(l => (l.UserId === currentUser.id) && (l.TweetId === tweet.id)),
          likeCount: likes.filter(like => like.TweetId === tweet.id).length,
          replyCount: replies.filter(reply => reply.TweetId === tweet.id).length
        }))
        res.render('tweets', { currentUser, tweets: newTweets, users: result.slice(0, 10) })
      })
      .catch(err => next(err))
  },
  postTweet: async (req, res, next) => {
    try {
      const { description } = req.body
      if (description.length > 140) {
        throw new Error('請以 140 字以內為限')
      } else if (description.trim() === '') {
        throw new Error('內容不可空白')
      }
      const UserId = helpers.getUser(req).id
      const createdTweet = await Tweet.create({
        UserId,
        description
      })
      if (!createdTweet) {
        throw new Error('發推失敗')
      }
      req.flash('success_messages', '發推成功！')
      return res.redirect('back')
    } catch (err) {
      next(err)
    }
  },
  getTweet: (req, res, next) => {
    const currentUser = helpers.getUser(req)
    return Promise.all([
      Tweet.findByPk(req.params.id, {
        include: [
          User,
          { model: Reply, include: User },
          { model: Like }],
        order: [[Reply, 'createdAt', 'desc']]
      }),
      User.findAll({
        include: [{ model: User, as: 'Followers' }],
        where: { role: 'user' }
      })
    ])
      .then(([tweet, users]) => {
        if (!tweet) throw new Error("Tweet doesn't exist!")
        const tweetINDIV = tweet.toJSON()
        const result = users
          .map(user => ({
            ...user.toJSON(),
            followerCount: user.Followers.length,
            isFollowed: user.Followers.some(follower => follower.id === currentUser.id),
            isCurrentUser: user.id === currentUser.id
          }))
          .sort((a, b) => b.followerCount - a.followerCount)
        tweetINDIV.isLiked = tweetINDIV.Likes.map(like => Object.values(like)[1]).some(e => e === currentUser.id)
        res.render('tweet', { currentUser, tweet: tweetINDIV, users: result.slice(0, 10) })
      }
      )
  },
  postLike: (req, res, next) => {
    const TweetId = req.params.id
    return Promise.all([
      Tweet.findByPk(TweetId),
      Like.findOne({
        where: {
          UserId: helpers.getUser(req).id,
          TweetId
        }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error("Tweet doesn't exist!")
        if (like) throw new Error('You have liked this!')
        return Like.create({
          UserId: helpers.getUser(req).id,
          TweetId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  postUnlike: (req, res, next) => {
    const TweetId = req.params.id
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this tweet.")
        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  postReply: async (req, res, next) => {
    const UserId = helpers.getUser(req).id
    const comment = req.body.comment
    const TweetId = req.params.id
    const existTweet = Tweet.findByPk(TweetId)
    if (!existTweet) {
      req.flash('error_messages', '這個推文已經不存在！')
      res.redirect('/')
    }
    if (!comment) {
      req.flash('error_messages', '內容不可空白')
      res.redirect('back')
    }
    await Reply.create({ UserId, TweetId, comment })
    return res.redirect('back')
  }
}

module.exports = tweetController
