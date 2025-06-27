'use strict'

const Partner = use('App/Models/Partner')
const LogError = use('App/Models/LogError')
const moment = require('moment')
const Helpers = use('Helpers')
const fs = require('fs').promises
const path = require('path')
const DateFormatter = use('App/Services/Date/DateFormatter.js')

class PartnerController {
async index({ response }) {
  try {
    const partners = await Partner.all()
    const formattedPartners = partners.toJSON().map(partner => ({
      ...partner,
      expires_at: DateFormatter.toBrazilianDateTime(partner.expires_at),
      created_at: DateFormatter.toBrazilianDateTime(partner.created_at),
      updated_at: DateFormatter.toBrazilianDateTime(partner.updated_at),
    }))
    return response.json(formattedPartners)
  } catch (error) {
    return this.logAndRespond(error, response, 'index', 'Failed to list partners.')
  }
}

async show({ params, response }) {
  try {
    const partner = await Partner.findOrFail(params.id)
    const formattedPartner = {
      ...partner.toJSON(),
      expires_at: DateFormatter.toBrazilianDateTime(partner.expires_at),
      created_at: DateFormatter.toBrazilianDateTime(partner.created_at),
      updated_at: DateFormatter.toBrazilianDateTime(partner.updated_at),
    }
    return response.json(formattedPartner)
  } catch (error) {
    const status = (error.name === 'ModelNotFoundException') ? 404 : 500
    const message = (status === 404) ? 'Partner not found.' : 'Error fetching partner.'
    return this.logAndRespond(error, response, 'show', message, status)
  }
}

  async store({ request, response }) {
    try {
      const data = request.only(['name', 'expires_at'])
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      if (data.expires_at) {
        const parsedDate = moment(data.expires_at, 'DD/MM/YYYY', true)
        if (!parsedDate.isValid()) {
          return response.status(404).json({ message: 'Invalid date format. Expected DD/MM/YYYY.' })
        }
        const today = moment().startOf('day')
        if (parsedDate.isBefore(today)) {
          return response.status(404).json({ message: 'Expiration date cannot be earlier than creation date.' })
        }
        data.expires_at = parsedDate.format('YYYY-MM-DD')
      }
      const timestamp = Date.now()
      const coverImage = request.file('cover_image', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (coverImage) {
        const coverName = `${timestamp}_${coverImage.clientName}`
        await coverImage.move(Helpers.publicPath('uploads/partners'), { name: coverName, overwrite: true })
        if (!coverImage.moved()) throw coverImage.error()
        data.cover_image = `${baseUrl}/uploads/partners/${coverName}`
      }
      const partner = await Partner.create(data)
      return response.status(200).json(partner)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating partner.')
    }
  }


  async update({ params, request, response }) {
    try {
      const partner = await Partner.findOrFail(params.id)
      const data = request.only(['name', 'expires_at'])
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      if (data.expires_at) {
        const parsedDate = moment(data.expires_at, 'DD/MM/YYYY', true)
        if (!parsedDate.isValid()) {
          return response.status(404).json({ message: 'Invalid date format. Expected DD/MM/YYYY.' })
        }
        const createdAt = moment(partner.created_at)
        if (parsedDate.isBefore(createdAt, 'day')) {
          return response.status(404).json({ message: 'Expiration date cannot be earlier than creation date.' })
        }
        data.expires_at = parsedDate.format('YYYY-MM-DD')
      }
      const timestamp = Date.now()
      const coverImage = request.file('cover_image', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (coverImage) {
        if (partner.cover_image) {
          await this.deleteFileIfExists(partner.cover_image)
        }
        const coverName = `${timestamp}_${coverImage.clientName}`
        await coverImage.move(Helpers.publicPath('uploads/partners'), { name: coverName, overwrite: true })
        if (!coverImage.moved()) throw coverImage.error()
        data.cover_image = `${baseUrl}/uploads/partners/${coverName}`
      }
      partner.merge(data)
      await partner.save()
      return response.json(partner)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Partner not found.' : 'Error updating partner.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }


  async destroy({ params, response }) {
    try {
      const partners = await Partner.findOrFail(params.id)
      if (partners.cover_image) {
        await this.deleteImageIfExists(partners.cover_image)
      }
      await partners.delete()
      return response.json({ message: 'Partner deleted succesfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 500
      const message = (status === 404) ? 'Partners do not foun.' : 'Error deleting Partners.'
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
      controller: 'PartnerController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = PartnerController
