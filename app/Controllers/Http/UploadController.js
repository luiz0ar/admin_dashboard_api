'use strict'

const Helpers = use('Helpers')
const today = new Date()

class UploadController {
    async upload({ request, response }) {
    const image = request.file('file', {
      types: ['image'],
      size: '5mb'
    })

    if (!image) {
      return response.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const fileName = `${today.getTime()}.${image.subtype}`
    await image.move(Helpers.publicPath('uploads/alertImages'), {
      name: fileName,
      overwrite: true
    })

    if (!image.moved()) {
      return response.status(500).json({ error: image.error().message })
    }

    // Retorna a URL pública da imagem
    const url = `/uploads/alertImages/${fileName}`
    return response.json({ url })
  }
}

module.exports = UploadController
