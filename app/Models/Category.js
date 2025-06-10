'use strict'

const Model = use('Model')

class Category extends Model {
  /**
   * Mutator (Setter): Executa toda vez que a propriedade 'name' é definida.
   * Garante que o nome da categoria seja sempre salvo em maiúsculas.
   */
  static get traits () {
    return [
      '@provider:Adonis/Acl/HasRole',
      '@provider:Adonis/Acl/HasPermission'
    ]
  }
  static boot () {
    super.boot()

    this.addTrait('NoTimestamp')
  }
  setName (name) {
    return name.toUpperCase()
  }
}

module.exports = Category
