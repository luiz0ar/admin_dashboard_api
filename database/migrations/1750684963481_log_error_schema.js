'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LogErrorSchema extends Schema {
  up () {
    this.create('log_errors', (table) => {
      table.increments()
      table.text('jsonError', 'longtext')
      table.string('controller').notNullable()
      table.string('function').notNullable()
      table.text('message').notNullable()
      table.text('solutioned_at')
      table.timestamps()
    })
  }

  down () {
    this.drop('log_errors')
  }
}

module.exports = LogErrorSchema
