'use strict'

const Schema = use('Schema')

class UpdateTokensTableSchema extends Schema {
  up () {
    this.table('tokens', (table) => {
      table.timestamp('expires_at').nullable()
      table.timestamp('revoked_at').nullable()
      table.string('ip', 45).nullable()
      table.string('user_agent').nullable()
    })
  }

  down () {
    this.table('tokens', (table) => {
      table.dropColumn('expires_at')
      table.dropColumn('revoked_at')
      table.dropColumn('ip')
      table.dropColumn('user_agent')
    })
  }
}

module.exports = UpdateTokensTableSchema
