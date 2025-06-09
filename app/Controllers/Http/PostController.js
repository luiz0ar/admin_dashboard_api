'use strict'

const Post = use('App/Models/Post')
const Helpers = use('Helpers')
const fs = use('fs')
const path = use('path')

class PostController {
  async index({ request, response }) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const posts = await Post.query()
      .orderBy('published_at', 'desc')
      .paginate(page, limit)
    return response.json(posts)
  }

  async store({ request, response, auth }) {
    try {
      const user = await auth.getUser()
      const coverFile = request.file('cover_image', {
        types: ['image'],
        size: '5mb'
      })
      let imagePath = null
      if (coverFile) {
        const fileName = `${Date.now()}.${coverFile.subtype}`
        await coverFile.move(Helpers.publicPath('uploads'), {
          name: fileName,
          overwrite: true
        })

        if (!coverFile.moved()) {
          return response.status(400).json({
            message: 'Failed to upload image.',
            error: coverFile.error()
          })
        }
        imagePath = `/uploads/${fileName}`
      }
      const data = request.only(['category', 'title', 'subtitle', 'description', 'published_at'])
      data.cover_image = imagePath
      data.author = user.username || user.email || user.id
      const post = await Post.create(data)
      return response.status(201).json(post)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Error to create post.', error })
    }
  }

  async show({ params, response }) {
    try {
      const post = await Post.findOrFail(params.id)
      return post
    } catch (error) {
      return response.status(404).json({ message: "Post not found." })
    }
  }

async update({ params, request, response }) {
  try {
    const post = await Post.findOrFail(params.id)
    const coverFile = request.file('cover_image', {
      types: ['image'],
      size: '2mb'
    })
    let newCoverPath = post.cover_image
    if (coverFile) {
      if (post.cover_image) {
        const previousPath = Helpers.publicPath(post.cover_image.replace('/uploads/', 'uploads/'))
        if (fs.existsSync(previousPath)) {
          fs.unlinkSync(previousPath)
        }
      }
      const fileName = `${Date.now()}.${coverFile.subtype}`
      await coverFile.move(Helpers.publicPath('uploads'), {
        name: fileName,
        overwrite: true
      })
      if (!coverFile.moved()) {
        return response.status(400).json({
          message: 'Error to save image.',
          error: coverFile.error()
        })
      }
      newCoverPath = `/uploads/${fileName}`
    }
    const data = request.only([
      'category', 'title', 'subtitle', 'author', 'description', 'published_at'
    ])
    data.cover_image = newCoverPath
    post.merge(data)
    await post.save()
    return response.status(200).json(post)
  } catch (error) {
    console.error(error)
    return response.status(400).json({ message: 'Error to update post.', error })
  }
}

  async destroy({ params, response }) {
    try {
      const post = await Post.findOrFail(params.id)
      await post.delete()
      return response.status(200).json({ message: 'Post deleted succesfully.' })
    } catch (error) {
      return response.status(404).json({ message: 'Post not found.' })
    }
  }
}
module.exports = PostController
