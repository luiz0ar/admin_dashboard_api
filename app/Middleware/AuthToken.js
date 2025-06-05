'use strict'

const Token = use('App/Models/Token')
const User = use('App/Models/User')
const moment = require('moment')

class AuthToken {
  async handle({ request, response }, next) {
    const authHeader = request.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Token not provided.' })
    }

    const tokenValue = authHeader.replace('Bearer ', '').trim()
    const token = await Token.query()
      .where('token', tokenValue)
      .where('is_revoked', false)
      .first()

    if (!token) {
      return response.status(401).json({ message: 'Invalid or revoked token.' })
    }

    if (token.expires_at && moment().isAfter(token.expires_at)) {
      token.is_revoked = true
      token.revoked_at = moment().toDate()
      await token.save()

      return response.status(401).json({ message: 'Token expired.' })
    }

    const user = await User.find(token.user_id)
    if (!user) {
      return response.status(401).json({ message: 'User not found for token.' })
    }
    request.authUser = user

    await next()
  }
}

module.exports = AuthToken
