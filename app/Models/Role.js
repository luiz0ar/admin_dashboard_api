'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Role extends Model {
 permissions() {
  return this.belongsToMany('App/Models/Permission')
    .pivotTable('permission_roles')
    .withTimestamps()
}
}

module.exports = Role
