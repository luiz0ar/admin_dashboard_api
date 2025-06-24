'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MenuStructureSchema extends Schema {
  up () {
    this.create('menu_structures', (table) => {
      table.increments()
      table.string('label', 254)
      table.string('title', 254)
      table.string('icon', 254)
      table.string('link', 254)
      table.string('href', 254)
      table.string('key', 254)
      table.string('father', 254)
      table.text('jsonStyle', 'longtext')
      table.boolean('active').default(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('menu_structures')
  }
}

module.exports = MenuStructureSchema
