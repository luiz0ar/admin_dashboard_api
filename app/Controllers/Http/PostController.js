'use strict'

const Post = use('App/Models/Post')
const Category = use('App/Models/Category')
const Database = use('Database')
const Helpers = use('Helpers')

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
    const trx = await Database.beginTransaction()
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
          await trx.rollback()
          return response.status(400).json({
            message: 'Failed uploading image.',
            error: coverFile.error()
          })
        }
        imagePath = `/uploads/${fileName}`
      }
      const { category_name, title, subtitle, description, published_at } = request.all()
      if (!category_name) {
        await trx.rollback()
        return response.status(400).send({ message: 'Category name is required.' })
      }
      const category = await Category.findOrCreate(
        { name: category_name },
        { name: category_name, created_by: user.id, updated_by: user.id },
        trx
      )
      const postData = {
        category: category.name,
        title,
        subtitle,
        description,
        published_at,
        cover_image: imagePath,
        author: user.username || user.email || user.id,
      }
      const post = await Post.create(postData, trx)
      await trx.commit()
      return response.status(201).json(post)
    } catch (error) {
      await trx.rollback()
      console.error('Error creating post:', error)
      return response.status(500).json({ message: 'Error creating post.', error: error.message })
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

  async update({ params, request, response, auth }) {
    try {
      const post = await Post.findOrFail(params.id)
      const data = request.only(['category', 'title', 'subtitle', 'description', 'published_at'])
      post.merge(data)
      await post.save()
      return response.status(200).json(post)
    } catch (error) {
      return response.status(400).json({ message: 'Error updating post.', error: error.message })
    }
  }

  async destroy({ params, response }) {
    try {
      const post = await Post.findOrFail(params.id)
      await post.delete()
      return response.status(200).json({ message: 'Post deleted succesfully.' })
    } catch (error) {
      return response.status(404).json({ message: "Post don't found." })
    }
  }
}

module.exports = PostController
