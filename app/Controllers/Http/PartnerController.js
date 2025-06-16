'use strict'

class PartnerController {
  async index({ response }) {
    const partners = await Partner.all()
    return response.json(partners)
  }

  async store({ request, response }) {
    const data = request.only(['cover_image', 'name', 'expires_at'])
    const partner = await Partner.create(data)
    return response.status(201).json(partner)
  }

  async show({ params, response }) {
    const partner = await Partner.find(params.id)
    if (!partner) {
      return response.status(404).json({ message: 'Partner not found.' })
    }
    return response.json(partner)
  }

  async update({ params, request, response }) {
    const partner = await Partner.find(params.id)
    if (!partner) {
      return response.status(404).json({ message: 'Partner not found.' })
    }
    const data = request.only(['cover_image', 'name', 'expires_at'])
    partner.merge(data)
    await partner.save()
    return response.json(partner)
  }

  async destroy({ params, response }) {
    const partner = await Partner.find(params.id)
    if (!partner) {
      return response.status(404).json({ message: 'Partner not found.' })
    }
    await partner.delete()
    return response.json({ message: 'Partner deleted succesfully.' })
  }
}

module.exports = PartnerController
