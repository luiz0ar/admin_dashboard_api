'use strict'

const Magazine = use('App/Models/Magazine')
const Helpers = use('Helpers')
const LogError = use('App/Models/LogError')
const fs = require('fs').promises
const path = require('path')

class MagazineController {
  async index({ response }) {
    try {
      const magazines = await Magazine.all()
      return response.json(magazines)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list magazines.')
    }
  }

  async store({ request, response }) {
    try {
      const { title, edition, slug } = request.only(['title', 'edition', 'slug'])
      const timestamp = Date.now()
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      if (!/^\d+$/.test(edition)) {
        return response.status(400).json({ message: 'Edition must contain only numbers.' })
      }
      const pdf = request.file('pdf', { types: ['application'], extnames: ['pdf'] })
      if (!pdf) {
        return response.status(400).json({ message: 'PDF file is required.' })
      }
      const pdfName = `${timestamp}_${pdf.clientName}`
      await pdf.move(Helpers.publicPath('uploads/magazinesPdf'), { name: pdfName, overwrite: true })
      if (!pdf.moved()) throw pdf.error()
      let coverUrl = null
      const cover = request.file('cover', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (cover) {
        const coverName = `${timestamp}_${cover.clientName}`
        await cover.move(Helpers.publicPath('uploads/magazines'), { name: coverName, overwrite: true })
        if (!cover.moved()) throw cover.error()
        coverUrl = `${baseUrl}/uploads/magazines/${coverName}`
      }
      const magazine = await Magazine.create({
        title,
        edition,
        slug,
        pdf: `${baseUrl}/uploads/magazinesPdf/${pdfName}`,
        cover: coverUrl
      })
      return response.json({
        id: magazine.id,
        title: magazine.title,
        edition: magazine.edition,
        slug: magazine.slug,
        pdf: magazine.pdf,
        cover: magazine.cover,
        created_at: magazine.created_at
      })

    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating magazine.')
    }
  }


  async show({ params, response }) {
    try {
      const magazine = await Magazine.findOrFail(params.id)
      return response.json(magazine)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Magazine not found.' : 'Error fetching magazine.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async update({ params, request, response }) {
    try {
      const magazine = await Magazine.findOrFail(params.id)
      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`
      const timestamp = Date.now()
      const fieldsToUpdate = request.only(['title', 'edition', 'slug'])
      if (fieldsToUpdate.edition && !/^\d+$/.test(fieldsToUpdate.edition)) {
        return response.status(400).json({ message: 'Edition must contain only numbers.' })
      }
      magazine.merge(fieldsToUpdate)
      const pdf = request.file('pdf', { types: ['application'], extnames: ['pdf'] })
      if (pdf) {
        if (magazine.pdf) await this.deleteFileIfExists(magazine.pdf)
        const pdfName = `${timestamp}_${pdf.clientName}`
        await pdf.move(Helpers.publicPath('uploads/magazinesPdf'), { name: pdfName, overwrite: true })
        if (!pdf.moved()) throw pdf.error()
        magazine.pdf = `${baseUrl}/uploads/magazinesPdf/${pdfName}`
      }
      const cover = request.file('cover', { types: ['image'], extnames: ['jpg', 'jpeg', 'png'] })
      if (cover) {
        if (magazine.cover) await this.deleteFileIfExists(magazine.cover)
        const coverName = `${timestamp}_${cover.clientName}`
        await cover.move(Helpers.publicPath('uploads/magazines'), { name: coverName, overwrite: true })
        if (!cover.moved()) throw cover.error()
        magazine.cover = `${baseUrl}/uploads/magazines/${coverName}`
      }
      await magazine.save()
      return response.json({
        message: 'Magazine updated successfully.',
        data: {
          id: magazine.id,
          title: magazine.title,
          edition: magazine.edition,
          slug: magazine.slug,
          pdf: magazine.pdf,
          cover: magazine.cover,
        },
      })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Magazine not found.' : 'Error updating magazine.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const magazine = await Magazine.findOrFail(params.id)
      if (magazine.pdf) await this.deleteFileIfExists(magazine.pdf)
      if (magazine.cover) await this.deleteFileIfExists(magazine.cover)
      await magazine.delete()
      return response.json({ message: 'Magazine deleted succesfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Magazine not found.' : 'Error deleting magazine.'
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
      controller: 'MagazineController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = MagazineController
