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
          message: 'Formato de imagem inválido. Apenas JPG e PNG são permitidos.'
        })
      }
      if (file.size > 20 * 1024 * 1024) {
        return response.status(400).json({
          message: 'Imagem muito grande. O tamanho máximo permitido é 5MB.'
        })
      }
    }
    await next()
  }
}

module.exports = ValidateImageUpload
