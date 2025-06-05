'use strict'

const Model = use('Model')

class Token extends Model {
  static get hidden () {
    return ['is_revoked']
  }

  static get dates () {
    return super.dates.concat(['expires_at', 'revoked_at'])
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = Token
