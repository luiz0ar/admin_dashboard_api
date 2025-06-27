'use strict'

const Alert = use('App/Models/Alert')
const Helpers = use('Helpers')
const sharp = require('sharp')
const uuid = require('uuid').v4
const fs = require('fs').promises
const path = require('path')
const Database = use('Database')
const LogError = use('App/Models/LogError')
const DateFormatter = use('App/Services/Date/DateFormatter')

class AlertController {
  async index({ response }) {
    try {
      const alerts = await Alert.query().orderBy('created_at', 'desc').fetch()
      const alertsJson = alerts.toJSON().map(a => ({
        ...a,
        expires_at: DateFormatter.toBrazilianDate(a.expires_at),
        created_at: DateFormatter.toBrazilianDate(a.created_at),
        updated_at: DateFormatter.toBrazilianDate(a.updated_at)
      }))
      return response.json(alertsJson)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list alerts.')
    }
  }

  async store({ request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const rawData = request.only(['name', 'html', 'status', 'expires_at'])
      const data = {
        ...rawData,
        expires_at: DateFormatter.fromBrazilianDate(rawData.expires_at)
      }
      const attachment = request.file('attachment', {
        types: ['image', 'application'],
        size: '20mb'
      })
      if (attachment) {
        const ext = attachment.subtype === 'jpeg' || attachment.subtype === 'png' ? 'jpg' : attachment.extname
        const fileName = `${uuid()}.${ext}`
        const filePath = Helpers.publicPath(`uploads/alertImages/${fileName}`)
        try {
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          if (attachment.type === 'image') {
            await sharp(attachment.tmpPath).resize(1024).toFile(filePath)
          } else {
            await attachment.move(Helpers.publicPath('uploads/alertImages'), {
              name: fileName,
              overwrite: true
            })
          }
          const fileUrl = `/uploads/alertImages/${fileName}`
          data.html += `<p><a href="${fileUrl}" target="_blank" rel="noopener">Ver anexo</a></p>`
        } catch (fileError) {
          await trx.rollback()
          return this.logAndRespond(fileError, response, 'store', 'Error processing file.')
        }
      }
      const alert = await Alert.create(data, trx)
      await trx.commit()
      const alertJson = alert.toJSON()
      alertJson.expires_at = DateFormatter.toBrazilianDateTime(alertJson.expires_at)
      return response.status(200).json(alertJson)
    } catch (error) {
      await trx.rollback()
      return this.logAndRespond(error, response, 'store', 'Error creating alert.')
    }
  }

  async update({ params, request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const alert = await Alert.findOrFail(params.id)
      const rawData = request.only(['name', 'html', 'status', 'expires_at'])
      const data = {
        ...rawData,
        expires_at: DateFormatter.fromBrazilianDate(rawData.expires_at)
      }
      const attachment = request.file('attachment', {
        types: ['image', 'application'],
        size: '20mb'
      })
      if (attachment) {
        const ext = attachment.subtype === 'jpeg' || attachment.subtype === 'png' ? 'jpg' : attachment.extname
        const fileName = `${uuid()}.${ext}`
        const filePath = Helpers.publicPath(`uploads/alertImages/${fileName}`)
        try {
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          if (attachment.type === 'image') {
            await sharp(attachment.tmpPath).resize(1024).toFile(filePath)
          } else {
            await attachment.move(Helpers.publicPath('uploads/alertImages'), {
              name: fileName,
              overwrite: true
            })
          }
          const fileUrl = `/uploads/alertImages/${fileName}`
          data.html += `<p><a href="${fileUrl}" target="_blank" rel="noopener">Ver novo anexo</a></p>`
        } catch (fileError) {
          await trx.rollback()
          return this.logAndRespond(fileError, response, 'update', 'Error to process files.')
        }
      }
      alert.merge(data)
      await alert.save(trx)
      await trx.commit()
      const alertJson = alert.toJSON()
      alertJson.expires_at = DateFormatter.toBrazilianDate(alertJson.expires_at)
      return response.json(alertJson)
    } catch (error) {
      await trx.rollback()
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Alert not found.' : 'Error updating alert.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const alert = await Alert.findOrFail(params.id)
      await alert.delete()
      return response.json({ message: 'Alert deleted successfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Alert not found.' : 'Error deleting alert.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  async show({ params, response }) {
    try {
      const alert = await Alert.findOrFail(params.id)
      const json = alert.toJSON()
      json.expires_at = DateFormatter.toBrazilianDate(json.expires_at)
      json.created_at = DateFormatter.toBrazilianDate(json.created_at)
      json.updated_at = DateFormatter.toBrazilianDate(json.updated_at)
      return response.json(json)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Alert not found.' : 'Error finding alert.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async activeAlert({ response }) {
    try {
      const today = new Date()
      const alert = await Alert.query()
        .where('status', 'active')
        .where(function () {
          this.whereNull('expires_at').orWhere('expires_at', '>=', today)
        })
        .orderBy('created_at', 'desc')
        .first()
      const json = alert ? alert.toJSON() : {}
      if (json.expires_at) json.expires_at = DateFormatter.toBrazilianDate(json.expires_at)
      return response.json(json)
    } catch (error) {
      return this.logAndRespond(error, response, 'activeAlert', 'Error finding active alert.')
    }
  }

  async upload({ request, response }) {
    const image = request.file('file', {
      types: ['image'],
      size: '5mb'
    })
    if (!image) {
      return response.status(400).json({ error: 'Nenhum arquivo enviado' })
    }
    const fileName = `${Date.now()}.${image.subtype}`
    await image.move(Helpers.publicPath('uploads/alertImages'), {
      name: fileName,
      overwrite: true
    })
    if (!image.moved()) {
      return response.status(500).json({ error: image.error().message })
    }
    const url = `/uploads/alertImages/${fileName}`
    return response.json({ url })
  }

  /**
   * Private: Centralized error logger and response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'AlertController',
      function: func,
      message: error.message
    })
    console.error(`Erro em ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = AlertController
