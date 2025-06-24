'use strict'

const Event = use('App/Models/Event')
const Helpers = use('Helpers')
const LogError = use('App/Models/LogError')
const fs = require('fs').promises
const path = require('path')

class EventController {
  async index({ response }) {
    try {
      const events = await Event.all()
      return response.json(events)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list events.')
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['title', 'description', 'start', 'end'])
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      const timestamp = Date.now()
      const coverImage = request.file('cover_image', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (coverImage) {
        const fileName = `${timestamp}_${coverImage.clientName}`
        await coverImage.move(Helpers.publicPath('uploads/events'), { name: fileName, overwrite: true })
        if (!coverImage.moved()) throw coverImage.error()
        data.cover_image = `${baseUrl}/uploads/events/${fileName}`
      }
      const event = await Event.create(data)
      return response.status(200).json(event)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating event.')
    }
  }

  async show({ params, response }) {
    try {
      const event = await Event.findOrFail(params.id)
      return response.json(event)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Event not found.' : 'Error fetching event.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async update({ params, request, response }) {
    try {
      const event = await Event.findOrFail(params.id)
      const data = request.only(['title', 'description', 'start', 'end'])
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      const timestamp = Date.now()
      const coverImage = request.file('cover_image', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (coverImage) {
        if (event.cover_image) await this.deleteFileIfExists(event.cover_image)
        const fileName = `${timestamp}_${coverImage.clientName}`
        await coverImage.move(Helpers.publicPath('uploads/events'), { name: fileName, overwrite: true })
        if (!coverImage.moved()) throw coverImage.error()
        data.cover_image = `${baseUrl}/uploads/events/${fileName}`
      }
      event.merge(data)
      await event.save()
      return response.json(event)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Event not found.' : 'Error updating event.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const event = await Event.findOrFail(params.id)
      if (event.cover_image) await this.deleteFileIfExists(event.cover_image)
      await event.delete()
      return response.json({ message: 'Event deleted successfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Event not found.' : 'Error deleting event.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  async deleteFileIfExists(fileUrl) {
    try {
      const publicPath = Helpers.publicPath()
      let relativePath = fileUrl.replace(process.env.APP_URL, '').replace(/^\/+/, '')
      const fullPath = path.join(publicPath, relativePath)
      await fs.access(fullPath)
      await fs.unlink(fullPath)
    } catch (err) {
      console.warn(`Failed to deleted image: ${fileUrl}`, err.message)
    }
  }

  /**
   * Private: Centralized error logger and response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'EventController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = EventController
