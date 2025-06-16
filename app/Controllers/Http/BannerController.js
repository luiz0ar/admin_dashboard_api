'use strict'

class BannerController {

  async index () {
    return view.render('banner')
  }

  async store ({ request, response }) {
    const data = request.only(['cover_image', 'title', 'description', 'start', 'end'])
    const banner = await Banner.create(data)
    return response.status(201).json(banner)
  }

  async show ({ params, response }) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.status(404).json({ message: 'Banner not found.' })
    }
    return response.json(banner)
  }

  async update ({ params, request, response }) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.status(404).json({ message: 'Banner not found.' })
    }
    const data = request.only(['cover_image', 'title', 'description', 'start', 'end'])
    banner.merge(data)
    await banner.save()
    return response.json(banner)
  }

  async destroy ({ params, response }) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.status(404).json({ message: 'Banner not found.' })
    }
    await banner.delete()
    return response.json({ message: 'Banner deleted succesfully.' })
  }
}

module.exports = BannerController
