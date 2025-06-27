'use strict'

const Category = use('App/Models/Category')
const LogError = use('App/Models/LogError')
const Database = use('Database')

class CategoryController {
  async index({ response }) {
    try {
      const categories = await Category.query().select('id', 'name', 'created_by').orderBy('created_at', 'desc').fetch()
      return response.json(categories)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list categories.')
    }
  }

  async store({ request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const { name, created_by } = request.only(['name', 'created_by'])

      const category = await Category.create({
        name,
        created_by,
        updated_by: null
      }, trx)

      await trx.commit()
      return response.status(200).json(category)
    } catch (error) {
      await trx.rollback()
      return this.logAndRespond(error, response, 'store', 'Error creating category.')
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
      return this.logAndRespond(error, response, 'show', 'Error fetching category.')
    }
  }

  async update({ params, request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const { name, created_by } = request.only(['name', 'created_by'])
      const category = await Category.find(params.id)
      if (!category) {
        return response.status(404).json({ message: 'Category not found.' })
      }
      const updates = {}
      if (typeof name !== 'undefined') updates.name = name
      if (typeof created_by !== 'undefined') updates.created_by = created_by
      if (Object.keys(updates).length === 0) {
        return response.status(400).json({ message: 'No valid fields to update.' })
      }
      category.merge(updates)
      await category.save(trx)
      await trx.commit()
      return response.json(category)
    } catch (error) {
      await trx.rollback()
      return this.logAndRespond(error, response, 'update', 'Error updating category.')
    }
  }

  async destroy({ params, response }) {
    try {
      const category = await Category.find(params.id)

      if (!category) {
        return response.status(404).json({ message: 'Category not found.' })
      }

      await category.delete()
      return response.json({ message: 'Category deleted successfully.' })
    } catch (error) {
      return this.logAndRespond(error, response, 'destroy', 'Error deleting category.')
    }
  }

  /**
   * Private: Centralized error logger and response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'CategoryController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = CategoryController
