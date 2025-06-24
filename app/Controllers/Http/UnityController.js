'use strict'

const Unity = use('App/Models/Unity')
const Helpers = use('Helpers')
const { validate } = use('Validator')
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

  async show({ params, response }) {
    try {
      const unity = await Unity.findOrFail(params.id)
      return response.json(unity)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Unity not found.' : 'Error fetching unity.'
      return this.logAndRespond(error, response, 'show', message, status)
    }
  }

  async store({ request, response }) {
    try {
      const phones = this.parseArray(request.input('phones'))
      const emails = this.parseArray(request.input('emails'))

      const data = {
        ...request.only(['name', 'address', 'cep', 'latitude', 'longitude']),
        phones,
        emails
      }

      const validation = await this.validateUnity(data)
      if (validation.fails()) {
        return response.status(422).json(validation.messages())
      }

      const bannerPath = await this.processBanner(request)
      if (bannerPath.error) return response.status(400).json(bannerPath)

      const unityData = { ...data, banner: bannerPath.path || null }
      const unity = await Unity.create(unityData)

      return response.json(unity)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Error creating unity.')
    }
  }

  async update({ params, request, response }) {
    try {
      const unity = await Unity.findOrFail(params.id)
      const phones = this.parseArray(request.input('phones'))
      const emails = this.parseArray(request.input('emails'))

      const data = {
        ...request.only(['name', 'address', 'cep', 'latitude', 'longitude']),
        phones,
        emails
      }

      const validation = await this.validateUnity(data)
      if (validation.fails()) {
        return response.status(422).json(validation.messages())
      }

      const bannerPath = await this.processBanner(request)
      if (bannerPath.error) return response.status(400).json(bannerPath)

      unity.merge({
        ...data,
        banner: bannerPath.path || unity.banner,
        phones: phones.length > 0 ? phones : null,
        emails: emails.length > 0 ? emails : null
      })

      await unity.save()
      return response.json(unity)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Unity not found.' : 'Error updating unity.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const unity = await Unity.findOrFail(params.id)
      await unity.delete()
      return response.status(204).send()
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException') ? 404 : 500
      const message = (status === 404) ? 'Unity not found.' : 'Error deleting unity.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  /**
   * Private: Parses array fields (phones, emails)
   */
  parseArray(input) {
    if (Array.isArray(input)) return input
    try {
      return JSON.parse(input || '[]')
    } catch {
      return []
    }
  }

  /**
   * Private: Runs validation
   */
  async validateUnity(data) {
    const rules = {
      name: 'required|string|max:100',
      address: 'string|max:255',
      cep: 'regex:^\\d{5}-\\d{3}$',
      latitude: 'number',
      longitude: 'number',
      phones: 'array',
      emails: 'array'
    }
    return await validate(data, rules)
  }

  /**
   * Private: Handles banner file upload
   */
  async processBanner(request) {
    const bannerFile = request.file('banner', { types: ['image'], size: '2mb' })
    if (!bannerFile) return {}

    const fileName = `${Date.now()}.${bannerFile.subtype}`
    await bannerFile.move(Helpers.publicPath('uploads/unities'), {
      name: fileName,
      overwrite: true
    })

    if (!bannerFile.moved()) {
      return { error: bannerFile.error() }
    }

    return { path: `uploads/unities/${fileName}` }
  }

  /**
   * Private: Centralized error logging and response
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
