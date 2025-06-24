'use strict'

const User = use('App/Models/User')
const Hash = use('Hash')
const Token = use('App/Models/Token')
const moment = require('moment')
const LogError = use('App/Models/LogError')

class UserController {
  async index({ response }) {
    try {
      const users = await User.all()
      return response.json(users)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list users.')
    }
  }

  async store({ request, response }) {
    try {
      const { username, email, password } = request.only(['username', 'email', 'password'])
      const user = await User.create({ username, email, password })
      return response.json(user)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating user.')
    }
  }

  async show({ params, response }) {
    try {
      const user = await User.findOrFail(params.id)
      return response.json(user)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'User not found.' : 'Error fetching user.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async update({ params, request, response }) {
    try {
      const user = await User.findOrFail(params.id)
      const data = request.only(['username', 'email', 'password'])

      user.merge(data)
      await user.save()

      return response.json(user)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 400
      const message = (status === 404) ? 'User not found.' : 'Error updating user.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const user = await User.findOrFail(params.id)
      await user.delete()
      return response.json({ message: 'User deleted successfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'User not found.' : 'Error deleting user.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  async login({ request, response, auth }) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const user = await User.findBy('email', email)

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
        message: 'Login successful.',
        token: tokenData.token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      })
    } catch (error) {
      return this.logAndRespond(error, response, 'login', 'Error during login.')
    }
  }

  async logout({ request, response }) {
    try {
      const tokenHeader = request.header('Authorization')
      if (!tokenHeader) {
        return response.status(400).json({ message: 'Token not provided.' })
      }

      const tokenValue = tokenHeader.replace('Bearer ', '')
      const token = await Token.findBy('token', tokenValue)

      if (!token) {
        return response.status(404).json({ message: 'Token not found.' })
      }

      token.is_revoked = true
      await token.save()

      return response.json({ message: 'Logout successful.' })
    } catch (error) {
      return this.logAndRespond(error, response, 'logout', 'Error during logout.')
    }
  }

  /**
   * Private helper for error logging and response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'UserController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = UserController
