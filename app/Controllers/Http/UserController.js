'use strict'

const User = use('App/Models/User')
const Hash = use('Hash')
const Token = use('App/Models/Token')
const moment = require('moment')

class UserController {
  async login({ request, response, auth }) {
    const { username, password } = request.only(['username', 'password'])
    const user = await User.findBy('username', username)

    if (!user) {
      return response.status(404).json({ message: 'User or password invalid.' })
    }
    if (user.blocked_at) {
      return response.status(403).json({
        message: 'User blocked. Please contact an administrator.',
        blocked_at: user.blocked_at
      })
    }

    const isPasswordValid = await Hash.verify(password, user.password)

    if (!isPasswordValid) {
      user.tries = (user.tries || 0) + 1
      if (user.tries >= 5) {
        user.blocked_at = moment().format('YYYY-MM-DD HH:mm:ss')
      }
      await user.save()
      return response.status(401).json({
        message: 'User or password invalid.',
        tries: user.tries,
        blocked: !!user.blocked_at
      })
    }

    user.tries = 0
    user.blocked_at = null
    await user.save()

    const tokenData = await auth.generate(user)
    await Token.create({
      user_id: user.id,
      token: tokenData.token,
      type: 'jwt',
      is_revoked: false,
      ip: request.ip(),
      user_agent: request.header('user-agent')
    })

    return response.json({
      message: 'Login successfully',
      token: tokenData.token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  }

  async logout({ auth, request, response }) {
    const tokenHeader = request.header('Authorization')

    if (!tokenHeader) {
      return response.status(400).json({ message: 'Token not informed.' })
    }

    const tokenValue = tokenHeader.replace('Bearer ', '')

    const token = await Token.findBy('token', tokenValue)

    if (!token) {
      return response.status(404).json({ message: 'Token not finded.' })
    }

    token.is_revoked = true
    await token.save()

    return response.json({ message: 'Logout succesfully.' })
  }

  async index({ response }) {
    const users = await User.all()
    return response.json(users)
  }

  async show({ params, response }) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }
    return response.json(user)
  }

  async store({ request, response }) {
    const data = request.only(['username', 'email', 'password'])
    const user = await User.create({ ...data, tries: 0 })
    if (data.password) {
      data.password = await Hash.make(data.password)
    }
    return response.status(201).json(user)
  }

  async update({ params, request, response }) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }

    if (data.password) {
      data.password = await Hash.make(data.password)
    }

    const data = request.only(['username', 'email', 'password'])
    user.merge(data)
    await user.save()

    return response.json(user)
  }

  async destroy({ params, response }) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }
    await user.delete()

    return response.json({ message: 'User deleted succesfully.' })
  }

  async auth({ auth, response }) {
    try {
      const user = await auth.getUser()
      return response.json(user)
    } catch (error) {
      return response.status(401).json({ message: 'Invalid ou expired token.' })
    }
  }
}
module.exports = UserController
