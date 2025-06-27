'use strict'

const User = use('App/Models/User')
const Hash = use('Hash')
const Token = use('App/Models/Token')
const moment = require('moment')
const LogError = use('App/Models/LogError')
const Database = use('Database')

class UserController {
  async auth({ auth, response }) {
    try {
      const user = await auth.getUser()
      return response.json({
        id: user.id,
        username: user.username,
        email: user.email
      })
    } catch (error) {
      console.error('[auth/me]', error)
      return response.status(500).json({ message: 'Erro ao buscar usuário autenticado' })
    }
  }

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
    const trx = await Database.beginTransaction()
    try {
      const { email, password } = request.only(['email', 'password'])
      if (!email || !password) {
        return response.status(400).json({ message: 'Invalid credentials.' })
      }
      const user = await User.query().where('email', email).first()
      const passwordHash = user ? user.password : '$2y$12$fakeHashForTimingAttackPrevention'
      const isPasswordValid = await Hash.verify(password, passwordHash)
      if (!user || !isPasswordValid) {
        if (user) {
          user.tries = (user.tries || 0) + 1
          if (user.tries >= 5) {
            user.blocked_at = moment().format('YYYY-MM-DD HH:mm:ss')
          }
          await user.save(trx)
        }
        await trx.commit()
        return response.status(401).json({
          message: 'Invalid credentials.',
        })
      }
      if (user.blocked_at) {
        await trx.commit()
        return response.status(403).json({
          message: 'Account blocked. Contact administrator.'
        })
      }
      user.tries = 0
      user.blocked_at = null
      await user.save(trx)
      const tokenData = await auth.generate(user)
      await Token.create({
        user_id: user.id,
        token: tokenData.token,
        type: 'jwt',
        is_revoked: false,
        ip: request.ip(),
        user_agent: request.header('user-agent') || 'unknown'
      }, trx)
      await trx.commit()
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
      await trx.rollback()
      await LogError.create({
        controller: 'UserController',
        function: 'login',
        jsonError: JSON.stringify(error),
        message: error.message,
        user_agent: request.header('user-agent') || 'unknown',
        ip: request.ip()
      })

      return response.status(500).json({
        message: 'An unexpected error occurred. Please try again later.'
      })
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
