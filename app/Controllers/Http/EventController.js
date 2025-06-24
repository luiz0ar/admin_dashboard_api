'use strict'

class EventController {
  async index({ response }) {
    const events = await Event.all()
    return response.json(events)
  }

  async store({ request, response }) {
    const data = request.only(['cover_image', 'title', 'description', 'start', 'end'])
    const event = await Event.create(data)
    return response.status(200).json(event)
  }

  async show({ params, response }) {
    const event = await Event.find(params.id)
    if (!event) {
      return response.status(404).json({ message: 'Event not found.' })
    }
    return response.json(event)
  }

  async update({ params, request, response }) {
    const event = await Event.find(params.id)
    if (!event) {
      return response.status(404).json({ message: 'Event not found.' })
    }
    const data = request.only(['cover_image', 'title', 'description', 'start', 'end'])
    event.merge(data)
    await event.save()
    return response.json(event)
  }

  async destroy({ params, response }) {
    const event = await Event.find(params.id)
    if (!event) {
      return response.status(404).json({ message: 'Event not found.' })
    }
    await event.delete()
    return response.json({ message: 'Event deleted succesfully.' })
  }
}

module.exports = EventController
