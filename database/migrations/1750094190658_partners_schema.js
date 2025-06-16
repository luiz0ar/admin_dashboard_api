'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PartnersSchema extends Schema {
  up () {
    this.create('partners', (table) => {
      table.increments()
      table.string('cover_image').nullable()
      table.string('name').notNullable()
      table.date('expires_at').notNullable()
      table.timestamps()
    })
  }
  down () {
    this.drop('partners')
  }
}

module.exports = PartnersSchema
