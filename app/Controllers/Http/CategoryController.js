'use strict'

const Category = use('App/Models/Category')
const LogError = use('App/Models/LogError')
const Database = use('Database')

class CategoryController {
  async index({ response }) {
    try {
      const Categorys = await Category.query()
        .select('id', 'name', 'created_by')
        .fetch()

      return response.json(Categorys)
    } catch (error) {
      console.error('Erro ao listar categorias:', error.message)
      await LogError.create({
        jsonError: JSON.stringify(error),
        controller: 'CategoryController',
        function: 'index',
        message: error.message
      })
      return response.status(500).json({ message: 'Internal error.' })
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['name', 'created_by'])

      const category = await Category.create({
        name: data.name,
        created_by: data.created_by,
        updated_by: null
      })

      return response.status(200).json(category)
    } catch (error) {
      console.error('Erro ao criar categoria:', error.message)
      await LogError.create({
        jsonError: JSON.stringify(error),
        controller: 'CategoryController',
        function: 'store',
        message: error.message
      })
      return response.status(500).json({ message: 'Internal error.' })
    }
  }

  async show({ params, response }) {
    try {
      const category = await Category.query()
        .select('id', 'name', 'created_by', 'updated_by', 'created_at', 'updated_at')
        .where('id', params.id)
        .first()

      if (!category) {
        return response.status(404).json({ message: 'Category not found.' })
      }

      return response.json(category)
    } catch (error) {
      console.error('Erro ao buscar categoria:', error.message)
      await LogError.create({
        jsonError: JSON.stringify(error),
        controller: 'CategoryController',
        function: 'show',
        message: error.message
      })
      return response.status(500).json({ message: 'Internal error.' })
    }
  }

  async update({ params, request, response }) {
    try {
      const data = request.only(['name', 'updated_by'])

      const category = await Category.find(params.id)
      if (!category) {
        return response.status(404).json({ message: 'Category not found.' })
      }

      category.name = data.name
      category.updated_by = data.updated_by

      await category.save()

      return response.json(category)
    } catch (error) {
      console.error('Error updating category:', error.message)
      await LogError.create({
        jsonError: JSON.stringify(error),
        controller: 'CategoryController',
        function: 'update',
        message: error.message
      })
      return response.status(500).json({ message: 'Internal error.' })
    }
  }

  async destroy({ params, response }) {
    try {
      const category = await Category.find(params.id)
      if (!category) {
        return response.status(404).json({ message: 'Category not found.' })
      }

      await category.delete()
      return response.json({ message: 'Category deleted succesfully.' })
    } catch (error) {
      console.error('Error deleting category:', error.message)
      await LogError.create({
        jsonError: JSON.stringify(error),
        controller: 'CategoryController',
        function: 'destroy',
        message: error.message
      })
      return response.status(500).json({ message: 'Internal error.' })
    }
  }
}

module.exports = CategoryController
