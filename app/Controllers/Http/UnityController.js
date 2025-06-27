'use strict'

const Unity = use('App/Models/Unity')
const Helpers = use('Helpers')
const sharp = require('sharp')
const uuid = require('uuid').v4
const fs = require('fs').promises
const path = require('path')
const Database = use('Database')
const LogError = use('App/Models/LogError')

class UnityController {
  async index({ response }) {
    try {
      const unities = await Unity.all()
      return response.json(unities)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list unities.')
    }
  }

  async store({ request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const data = request.only(['name', 'address', 'cep', 'latitude', 'longitude'])
      const phones = this.parseArray(request.input('phones'))
      const emails = this.parseArray(request.input('emails'))
      let imagePath = null
      const bannerFile = request.file('banner', { types: ['image'], size: '20mb' })
      if (bannerFile) {
        try {
          const fileName = `${uuid()}.jpg`
          const outputPath = Helpers.publicPath(`uploads/unities/${fileName}`)
          await sharp(bannerFile.tmpPath)
            .resize(800, 600, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toFile(outputPath)
          imagePath = `/uploads/unities/${fileName}`
        } catch (imgError) {
          await trx.rollback()
          console.error('Image processing error:', imgError)
          return response.status(500).json({ message: 'Failed to process image.' })
        }
      }
      const unity = await Unity.create({
        ...data,
        phones,
        emails,
        banner: imagePath
      }, trx)
      await trx.commit()
      return response.json(unity)
    } catch (error) {
      await trx.rollback()
      return this.logAndRespond(error, response, 'store', 'Error creating unity.')
    }
  }

  async show({ params, response }) {
    try {
      const unity = await Unity.findOrFail(params.id)
      return response.json(unity)
    } catch (error) {
      const status = error.name === 'ModelNotFoundException' ? 404 : 500
      const message = status === 404 ? 'Unity not found.' : 'Error fetching unity.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async update({ params, request, response }) {
    try {
      const unity = await Unity.findOrFail(params.id)
      const data = request.only(['name', 'address', 'cep', 'latitude', 'longitude'])
      const phones = this.parseArray(request.input('phones'))
      const emails = this.parseArray(request.input('emails'))
      const bannerFile = request.file('banner', { types: ['image'], size: '20mb' })
      if (bannerFile) {
        try {
          if (unity.banner) await this.deleteFileIfExists(unity.banner)
          const fileName = `${uuid()}.jpg`
          const outputPath = Helpers.publicPath(`uploads/unities/${fileName}`)
          await sharp(bannerFile.tmpPath)
            .resize(800, 600, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toFile(outputPath)
          data.banner = `/uploads/unities/${fileName}`
        } catch (imgError) {
          console.error('Image processing error:', imgError)
          return response.status(500).json({ message: 'Failed to process image.' })
        }
      }
      unity.merge({
        ...data,
        phones: phones.length ? phones : null,
        emails: emails.length ? emails : null,
        banner: data.banner || unity.banner
      })
      await unity.save()
      return response.json(unity)
    } catch (error) {
      const status = error.name === 'ModelNotFoundException' ? 404 : 400
      const message = status === 404 ? 'Unity not found.' : 'Error updating unity.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const unity = await Unity.findOrFail(params.id)
      if (unity.banner) await this.deleteFileIfExists(unity.banner)
      await unity.delete()
      return response.status(204).send()
    } catch (error) {
      const status = error.name === 'ModelNotFoundException' ? 404 : 500
      const message = status === 404 ? 'Unity not found.' : 'Error deleting unity.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  async deleteFileIfExists(relativePath) {
    try {
      const imagePath = path.join(Helpers.publicPath(), relativePath.replace(/^\/+/, ''))
      await fs.access(imagePath)
      await fs.unlink(imagePath)
    } catch (err) {
      console.warn(`Failed to delete image: ${relativePath}`, err.message)
    }
  }
  parseArray(input) {
    if (Array.isArray(input)) return input
    try {
      return JSON.parse(input || '[]')
    } catch {
      return []
    }
  }

  /**
   * Private: Centralized error logger and response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'UnityController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = UnityController
