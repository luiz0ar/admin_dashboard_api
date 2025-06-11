'use strict'

const Unity = use('App/Models/Unity')
const Helpers = use('Helpers')
const { validate } = use('Validator')

class UnityController {
  async store({ request, response }) {
    let phones = []
    let emails = []
    try {
      const rawPhones = request.input('phones')
      const rawEmails = request.input('emails')
      phones = Array.isArray(rawPhones)
        ? rawPhones
        : JSON.parse(rawPhones || '[]')

      emails = Array.isArray(rawEmails)
        ? rawEmails
        : JSON.parse(rawEmails || '[]')
    } catch (e) {
      return response.status(422).json({ message: 'Formato inválido para phones ou emails' })
    }
    if (!Array.isArray(phones)) phones = []
    if (!Array.isArray(emails)) emails = []
    const rules = {
      name: 'required|string|max:100',
      address: 'string|max:255',
      cep: 'regex:^\\d{5}-\\d{3}$',
      latitude: 'number',
      longitude: 'number',
      phones: 'array',
      emails: 'array'
    }
    const dataToValidate = {
      ...request.only(['name', 'address', 'cep', 'latitude', 'longitude']),
      phones,
      emails
    }
    const validation = await validate(dataToValidate, rules)
    if (validation.fails()) {
      return response.status(422).send(validation.messages())
    }
    const bannerFile = request.file('banner', {
      types: ['image'],
      size: '2mb'
    })
    let bannerPath = null
    if (bannerFile) {
      const fileName = `${Date.now()}.${bannerFile.subtype}`
      await bannerFile.move(Helpers.publicPath('uploads/unities'), {
        name: fileName,
        overwrite: true
      })
      if (!bannerFile.moved()) {
        return response.status(400).json({ error: bannerFile.error() })
      }
      bannerPath = `uploads/unities/${fileName}`
    }
    const unityData = {
      name: request.input('name'),
      address: request.input('address'),
      cep: request.input('cep'),
      latitude: request.input('latitude'),
      longitude: request.input('longitude'),
      banner: bannerPath
    }
    if (phones.length > 0) {
      unityData.phones = phones
    }
    if (emails.length > 0) {
      unityData.emails = emails
    }
    const unity = await Unity.create(unityData)
    return response.status(201).json(unity)
  }


  async index({ response }) {
    const unities = await Unity.all()
    return response.json(unities)
  }

  async show({ params, response }) {
    const unity = await Unity.findOrFail(params.id)
    return response.json(unity)
  }

async update({ params, request, response }) {
  const unity = await Unity.findOrFail(params.id)
  let phones = []
  let emails = []
  try {
    phones = JSON.parse(request.input('phones') || '[]')
  } catch (e) {
    phones = []
  }
  try {
    emails = JSON.parse(request.input('emails') || '[]')
  } catch (e) {
    emails = []
  }
  if (!Array.isArray(phones)) phones = []
  if (!Array.isArray(emails)) emails = []
  const validation = await validate(
    {
      name: request.input('name'),
      address: request.input('address'),
      cep: request.input('cep'),
      latitude: request.input('latitude'),
      longitude: request.input('longitude'),
      phones,
      emails
    },
    {
      name: 'required|string|max:100',
      address: 'string|max:255',
      cep: 'regex:^\\d{5}-\\d{3}$',
      latitude: 'number',
      longitude: 'number',
      phones: 'array',
      emails: 'array'
    }
  )
  if (validation.fails()) {
    return response.status(422).send(validation.messages())
  }
  const bannerFile = request.file('banner', {
    types: ['image'],
    size: '2mb'
  })
  let bannerPath = unity.banner
  if (bannerFile) {
    const fileName = `${Date.now()}.${bannerFile.subtype}`
    await bannerFile.move(Helpers.publicPath('uploads/unities'), {
      name: fileName,
      overwrite: true
    })
    if (!bannerFile.moved()) {
      return response.status(400).json({ error: bannerFile.error() })
    }
    bannerPath = `uploads/unities/${fileName}`
  }
  const updatedData = {
    name: request.input('name'),
    address: request.input('address'),
    cep: request.input('cep'),
    latitude: request.input('latitude'),
    longitude: request.input('longitude'),
    banner: bannerPath
  }
  if (phones.length > 0) updatedData.phones = phones
  else updatedData.phones = null
  if (emails.length > 0) updatedData.emails = emails
  else updatedData.emails = null
  unity.merge(updatedData)
  await unity.save()
  return response.status(200).json(unity)
}

  async destroy({ params, response }) {
    const unity = await Unity.findOrFail(params.id)
    await unity.delete()
    return response.status(204).send()
  }
}

module.exports = UnityController
