'use strict'

const Alert = use('App/Models/Alert')
const LogError = use('App/Models/LogError')
const moment = require('moment')

class AlertController {
  async index({ response }) {
    try {
      const alerts = await Alert.all()
      return response.json(alerts)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list alerts.')
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['name', 'html', 'status', 'expires_at'])
      if (data.expires_at) {
        const parsedDate = moment(data.expires_at, 'DD/MM/YYYY', true)
        if (!parsedDate.isValid()) {
          return response.status(404).json({ message: 'Invalid date format. Expected DD/MM/YYYY.' })
        }
        data.expires_at = parsedDate.format('YYYY-MM-DD')
      }
      const alert = await Alert.create(data)
      return response.status(200).json(alert)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating alert.')
    }
  }

  async show({ params, response }) {
    try {
      const alert = await Alert.findOrFail(params.id)
      return response.json(alert)
    } catch (error) {
      const status = error.name === 'ModelNotFoundException' ? 404 : 500
      const message = status === 404 ? 'Alert not found.' : 'Error fetching alert.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async update({ params, request, response }) {
    try {
      const alert = await Alert.findOrFail(params.id)
      const data = request.only(['name', 'html', 'status', 'expires_at'])

      if (data.expires_at) {
        const parsedDate = moment(data.expires_at, 'DD/MM/YYYY', true)
        if (!parsedDate.isValid()) {
          return response.status(404).json({ message: 'Invalid date format. Expected DD/MM/YYYY.' })
        }
        data.expires_at = parsedDate.format('YYYY-MM-DD')
      }

      alert.merge(data)
      await alert.save()

      return response.json(alert)
    } catch (error) {
      const status = error.name === 'ModelNotFoundException' ? 404 : 500
      const message = status === 404 ? 'Alert not found.' : 'Error updating alert.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const alert = await Alert.findOrFail(params.id)
      await alert.delete()
      return response.json({ message: 'Alert deleted successfully.' })
    } catch (error) {
      const status = error.name === 'ModelNotFoundException' ? 404 : 500
      const message = status === 404 ? 'Alert not found.' : 'Error deleting alert.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  /**
   * Private helper for error logging and standardized JSON error responses
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'AlertController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = AlertController
