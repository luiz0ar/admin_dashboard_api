'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddExtraFieldsToRolesSchema extends Schema {
  up () {
    this.create('add_extra_fields_to_roles', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('add_extra_fields_to_roles')
  }
}

module.exports = AddExtraFieldsToRolesSchema
