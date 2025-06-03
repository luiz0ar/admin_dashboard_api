'use strict'

const User = use('App/Models/User')
const Hash = use('Hash')
const moment = require('moment')

class UserController {
    async login ({ request, auth, response }) {
    const { username, password } = request.only(['username', 'password'])
    const user = await User.findBy('username', username)

    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }

    if (user.blocked_at) {
      return response.status(403).json({
        message: 'User blocked. Please contact an admin.',
        blocked_at: user.blocked_at
      })
    }

    const passwordValid = await Hash.verify(password, user.password)

    if (!passwordValid) {
      user.tries = (user.tries || 0) + 1

      if (user.tries >= 5) {
        user.blocked_at = moment().format('YYYY-MM-DD HH:mm:ss')
      }

      await user.save()

      return response.status(401).json({
        message: 'Wrong password',
        tries: user.tries,
        blocked: !!user.blocked_at
      })
    }
    user.tries = 0
    user.blocked_at = null
    await user.save()

    const token = await auth.generate(user)

    return response.json({
      message: 'Login succesfully.',
      user,
      token
    })
  }

  async index ({ response }) {
    const users = await User.all()
    return response.json(users)
  }

  async show ({ params, response }) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }
    return response.json(user)
  }

  async store ({ request, response }) {
    const data = request.only(['username', 'email', 'password'])
    const user = await User.create({ ...data, tries: 0 })
    return response.status(201).json(user)
  }

  async update ({ params, request, response }) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }

    const data = request.only(['username', 'email', 'password'])
    user.merge(data)
    await user.save()

    return response.json(user)
  }

  async destroy ({ params, response }) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }
    await user.delete()

    return response.json({ message: 'User deleted succesfully.' })
  }
}

module.exports = UserController
