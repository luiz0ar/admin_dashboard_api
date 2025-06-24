'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class ValidateImageUpload {
  async handle({ request, response }, next) {
    const file = request.file('cover_image')

    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']

      if (!allowedTypes.includes(file.type)) {
        return response.status(400).json({
          message: 'Invalid format. Only jpeg, jpg and png are allowed.'
        })
      }
      if (file.size > 20 * 800 * 600) {
        return response.status(400).json({
          message: 'Image bigger than allowed. Max image size is 20MB.'
        })
      }
    }
    await next()
  }
}

module.exports = ValidateImageUpload
