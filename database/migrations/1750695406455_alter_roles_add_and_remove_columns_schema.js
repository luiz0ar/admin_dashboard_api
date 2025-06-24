'use strict'

const Schema = use('Schema')

class AlterRolesAddAndRemoveColumnsSchema extends Schema {
  up () {
    this.table('roles', (table) => {
      table.dropColumn('status')
      table.dropColumn('order')
      table.string('slug').notNullable().unique()
      table.string('name').notNullable().unique()
      table.text('description').nullable()
    })
  }

  down () {
    this.table('roles', (table) => {
      table.boolean('status').defaultTo(true)
      table.integer('order').unsigned().nullable()
      table.dropColumn('slug')
      table.dropColumn('name')
      table.dropColumn('description')
    })
  }
}

module.exports = AlterRolesAddAndRemoveColumnsSchema
