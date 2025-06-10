'use strict'

const Category = use('App/Models/Category')

class CategoryController {
  async index({ response }) {
    const categories = await Category.query().orderBy('name', 'asc').fetch()
    return response.ok(categories)
  }

  async store({ request, response, auth }) {
    const { name } = request.all()
    const user = auth.user
    const category = await Category.create({
      name,
      created_by: user.id
    })
    return response.json(category)
  }

  async show({ params, response }) {
    const category = await Category.find(params.id)
    return response.json(category)
  }

  async update({ params, request, response, auth }) {
    const { name } = request.all()
    const user = auth.user

    const category = await Category.find(params.id)
    category.merge({
      name,
      updated_by: user.id
    })

    await category.save()
    return response.json(category)
  }

  async destroy({ params, response }) {
    const category = await Category.find(params.id)
    await category.delete()
    return response.json({ message: 'Category deleted successfully.' })
  }
}

module.exports = CategoryController
