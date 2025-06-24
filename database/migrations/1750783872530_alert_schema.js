'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlertSchema extends Schema {
  up () {
    this.create('alerts', (table) => {
      table.increments()
      table.string('name', 255).notNullable()
      table.string('html').notNullable()
      table.enum('status', ['active', 'inactive']).defaultTo('active').notNullable()
      table.date('expires_at').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('alerts')
  }
}

module.exports = AlertSchema
