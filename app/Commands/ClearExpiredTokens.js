'use strict'

const { Command } = require('@adonisjs/ace')
const Token = use('App/Models/Token')
const moment = require('moment')

class ClearExpiredTokens extends Command {
  static get signature () {
    return 'tokens:clear'
  }

  static get description () {
    return 'Delete tokens from database'
  }

  async handle (args, options) {
    this.info('Cleaning expired tokens...')

    const now = moment().toDate()

    const expiredTokens = await Token.query()
      .where('expires_at', '<', now)
      .delete()

    this.success(`Expired tokens deleted.`)
  }
}

module.exports = ClearExpiredTokens
