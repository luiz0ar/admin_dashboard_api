'use strict'

const Magazine = use('App/Models/Magazine')
const Helpers = use('Helpers')

class MagazineController {
  async index({ request, response }) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const magazines = await Magazine.query()
      .select('id', 'title', 'edition', 'slug', 'pdf', 'cover', 'created_at')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.json(magazines)
  }

 async store({ request, response }) {
    try {
      const { title, edition, slug } = request.only(['title', 'edition', 'slug'])

      const timestamp = Date.now()

      const baseUrl = process.env.APP_URL || `${request.protocol()}://${request.hostname()}:${process.env.PORT || 3333}`

      // PDF obrigatório
      const pdf = request.file('pdf', {
        types: ['application'],
        extnames: ['pdf'],
      })

      if (!pdf) {
        return response.status(400).json({ message: 'Arquivo PDF é obrigatório.' })
      }

      const pdfName = `${timestamp}_${pdf.clientName}`
      await pdf.move(Helpers.publicPath('uploads/magazinesPdf'), {
        name: pdfName,
        overwrite: true,
      })

      if (!pdf.moved()) throw pdf.error()

      // Capa (opcional)
      let coverName = null
      let coverUrl = null

      const cover = request.file('cover', {
        types: ['image'],
        extnames: ['jpg', 'jpeg', 'png'],
      })

      if (cover) {
        coverName = `${timestamp}_${cover.clientName}`
        await cover.move(Helpers.publicPath('uploads/magazines'), {
          name: coverName,
          overwrite: true,
        })

        if (!cover.moved()) throw cover.error()

        coverUrl = `${baseUrl}/uploads/magazines/${coverName}`
      }

      const magazine = await Magazine.create({
        title,
        edition,
        slug,
        pdf: `${baseUrl}/uploads/magazinesPdf/${pdfName}`,
        cover: coverUrl,
      })

      return response.status(200).json({
        id: magazine.id,
        title: magazine.title,
        edition: magazine.edition,
        slug: magazine.slug,
        pdf: magazine.pdf,
        cover: magazine.cover,
        created_at: magazine.created_at,
      })
    } catch (error) {
      console.error('Erro ao criar revista:', error.message || error)
      return response.status(500).json({ message: 'Erro ao salvar revista.' })
    }
  }

  async show({ params, response }) {
    try {
      const magazine = await Magazine.findOrFail(params.id)
      return response.json(magazine)
    } catch {
      return response.status(404).json({ message: 'Revista não encontrada.' })
    }
  }

  async update({ params, request, response }) {
    try {
      const magazine = await Magazine.findOrFail(params.id)
      const data = request.only(['title', 'edition', 'slug'])
      magazine.merge(data)
      await magazine.save()

      return response.json({
        message: 'Revista atualizada com sucesso.',
        data: {
          id: magazine.id,
          title: magazine.title,
          edition: magazine.edition,
          slug: magazine.slug,
        },
      })
    } catch {
      return response.status(404).json({ message: 'Erro ao atualizar revista.' })
    }
  }

  async destroy({ params, response }) {
    try {
      const magazine = await Magazine.findOrFail(params.id)
      await magazine.delete()
      return response.status(204).send()
    } catch {
      return response.status(404).json({ message: 'Erro ao excluir revista.' })
    }
  }
}

module.exports = MagazineController
