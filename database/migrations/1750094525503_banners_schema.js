'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BannersSchema extends Schema {
  up () {
    this.create('banners', (table) => {
      table.increments()
      table.string('link').nullable()
      table.string('cover_image').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('banners')
  }
}

module.exports = BannersSchema
