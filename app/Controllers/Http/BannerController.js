'use strict'

const Banner = use('App/Models/Banner')
const Helpers = use('Helpers')
const LogError = use('App/Models/LogError')
const fs = require('fs').promises
const path = require('path')

class BannerController {
  async index({ response }) {
    try {
      const banners = await Banner.all()
      return response.json(banners)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list banners.')
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['link'])
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      const timestamp = Date.now()
      const coverImage = request.file('cover_image', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (coverImage) {
        const fileName = `${timestamp}_${coverImage.clientName}`
        await coverImage.move(Helpers.publicPath('uploads/banners'), { name: fileName, overwrite: true })
        if (!coverImage.moved()) throw coverImage.error()
        data.cover_image = `${baseUrl}/uploads/banners/${fileName}`
      }
      const banner = await Banner.create(data)
      return response.status(200).json(banner)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating banner.')
    }
  }

  async show({ params, response }) {
    try {
      const banner = await Banner.findOrFail(params.id)
      return response.json(banner)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Banner not found.' : 'Error fetching banner.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async update({ params, request, response }) {
    try {
      const banner = await Banner.findOrFail(params.id)
      const data = request.only(['link'])
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      const timestamp = Date.now()
      const coverImage = request.file('cover_image', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (coverImage) {
        if (banner.cover_image) await this.deleteFileIfExists(banner.cover_image)
        const fileName = `${timestamp}_${coverImage.clientName}`
        await coverImage.move(Helpers.publicPath('uploads/banners'), { name: fileName, overwrite: true })
        if (!coverImage.moved()) throw coverImage.error()
        data.cover_image = `${baseUrl}/uploads/banners/${fileName}`
      }
      banner.merge(data)
      await banner.save()
      return response.json(banner)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Banner not found.' : 'Error updating banner.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const banner = await Banner.findOrFail(params.id)
      if (banner.cover_image) await this.deleteFileIfExists(banner.cover_image)
      await banner.delete()
      return response.json({ message: 'Banner deleted successfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Banner not found.' : 'Error deleting banner.'
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
      controller: 'BannerController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = BannerController
