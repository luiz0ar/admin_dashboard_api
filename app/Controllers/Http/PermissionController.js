'use strict'

const Permission = use('App/Models/Permission')
const LogError = use('App/Models/LogError')

class PermissionController {
  async index({ response }) {
    try {
      const permissions = await Permission.all()
      return response.json(permissions)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list permissions.')
    }
  }

  async show({ params, response }) {
    try {
      const permission = await Permission.findOrFail(params.id)
      return response.json(permission)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 500
      const message = (status === 404) ? 'Permission not found.' : 'Error fetching permission.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['name', 'slug', 'description'])
      const permission = await Permission.create(data)
      return response.json(permission)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating permission.')
    }
  }

  async update({ params, request, response }) {
    try {
      const permission = await Permission.findOrFail(params.id)
      const data = request.only(['name', 'slug', 'description'])

      permission.merge(data)
      await permission.save()

      return response.json(permission)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 400
      const message = (status === 404) ? 'Permission not found.' : 'Error updating permission.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const permission = await Permission.findOrFail(params.id)
      await permission.delete()
      return response.json({ message: 'Permission deleted successfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 500
      const message = (status === 404) ? 'Permission not found.' : 'Error deleting permission.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  /**
   * Private helper for logging errors and sending JSON response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'PermissionController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = PermissionController
