'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MagazinesSchema extends Schema {
  up () {
    this.create('magazines', (table) => {
      table.increments()
      table.string('title', 30).notNullable()
      table.integer('edition').notNullable()
      table.string('slug', 255).nullable()
      table.string('pdf', 255).notNullable()
      table.string('cover', 255).nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('magazines')
  }
}

module.exports = MagazinesSchema
