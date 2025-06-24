'use strict'

const LogError = use('App/Models/LogError')
const MenuStructure = use('App/Models/MenuStructure')

class MenuStructureController {
  async index({ response }) {
    try {
      const menuStructures = await MenuStructure.all()
      const result = this.buildTree(menuStructures.toJSON(), 'false')
      return response.json(result)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Unknown error. Please contact support.')
    }
  }

  buildTree(array, parentKey) {
    return array
      .filter(item => item.father === parentKey)
      .map(item => ({
        ...item,
        children: this.buildTree(array, item.key),
      }))
  }

  async show({ params, response }) {
    try {
      const menuStructure = await MenuStructure.findOrFail(params.id)
      return response.json(menuStructure)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 401
      const message = (status === 404) ? 'Menu structure not found.' : 'Unknown error. Please contact support.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['label', 'title', 'icon', 'link', 'href', 'key', 'father'])
      const menuStructure = await MenuStructure.create(data)
      return response.json(menuStructure)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating menu structure.')
    }
  }

 async update({ params, request, response, auth }) {
  try {
    const allowedFields = ['label', 'title', 'icon', 'link', 'href', 'key', 'father'];
    if (auth.user && auth.user.role === 'admin') {
      allowedFields.push('active');
    }
    const data = request.only(allowedFields);
    const menuStructure = await MenuStructure.findOrFail(params.id);
    menuStructure.merge(data);
    await menuStructure.save();
    return response.json(menuStructure);
  } catch (error) {
    const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 401;
    const message = (status === 404) ? 'Menu structure not found.' : 'Error updating menu structure.';
    return this.logAndRespond(error, response, 'update', message, status);
  }
}

  async destroy({ params, response }) {
    try {
      const menuStructure = await MenuStructure.findOrFail(params.id)
      await menuStructure.delete()
      return response.json({ message: 'Menu structure deleted successfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 401
      const message = (status === 404) ? 'Menu structure not found.' : 'Error deleting menu structure.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  /**
   * Private helper for error logging and JSON error response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'MenuStructureController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = MenuStructureController
