'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UnitiesSchema extends Schema {
  up () {
    this.create('unities', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.string('banner').nullable()
      table.json('phones').nullable()
      table.json('emails').nullable()
      table.string('address', 255)
      table.string('cep', 9)
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('unities')
  }
}

module.exports = UnitiesSchema
