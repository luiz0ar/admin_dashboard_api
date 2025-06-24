'use strict'

const Schema = use('Schema')

class AddPermissionRoleColumnsSchema extends Schema {
  up () {
    this.table('permission_roles', (table) => {
      table.integer('permission_id').unsigned().index()
      table.foreign('permission_id').references('id').on('permissions').onDelete('cascade')
      table.integer('role_id').unsigned().index()
      table.foreign('role_id').references('id').on('roles').onDelete('cascade')
    })
  }

  down () {
    this.table('permission_roles', (table) => {
      table.dropForeign('permission_id')
      table.dropColumn('permission_id')
      table.dropForeign('role_id')
      table.dropColumn('role_id')
    })
  }
}

module.exports = AddPermissionRoleColumnsSchema
