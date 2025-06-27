'use strict'

const Post = use('App/Models/Post')
const Category = use('App/Models/Category')
const Database = use('Database')
const Helpers = use('Helpers')
const sharp = require('sharp')
const uuid = require('uuid').v4
const fs = require('fs').promises
const path = require('path')
const LogError = use('App/Models/LogError')
const DateFormatter = use('App/Services/Date/DateFormatter.js')

class PostController {
  async index({ response }) {
    try {
      const posts = await Post.all()
       const formattedPosts = posts.toJSON().map(post => ({
        ...post,
        created_at: DateFormatter.toBrazilianDateTime(post.created_at),
        published_at: DateFormatter.toBrazilianDateTime(post.published_at),
        updated_at: DateFormatter.toBrazilianDateTime(post.updated_at)
      }))
      return response.json(formattedPosts)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Failed to list posts.')
    }
  }

  async store({ request, response }) {
    const trx = await Database.beginTransaction()
    try {
      const data = request.only(['category_name', 'title', 'description', 'published_at', 'author'])
      let imagePath = null
      const coverFile = request.file('cover_image', { types: ['image'], size: '20mb' })
      if (coverFile) {
        try {
          const fileName = `${uuid()}.jpg`
          const outputPath = Helpers.publicPath(`uploads/${fileName}`)
          await sharp(coverFile.tmpPath)
            .resize(800, 600, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toFile(outputPath)
          imagePath = `/uploads/${fileName}`
        } catch (imgError) {
          await trx.rollback()
          console.error('Image processing error:', imgError)
          return response.status(500).json({ message: 'Failed to process image.' })
        }
      }
      if (!data.category_name) {
        await trx.rollback()
        return response.status(400).json({ message: 'Category name is required.' })
      }
      const category = await Category.findOrCreate(
        { name: data.category_name },
        { name: data.category_name, created_by: 1, updated_by: 1 },
        trx
      )
      const post = await Post.create({
        category: category.name,
        title: data.title,
        description: data.description,
        published_at: data.published_at,
        cover_image: imagePath,
        author: data.author
      }, trx)
      await trx.commit()
      return response.json(post)
    } catch (error) {
      await trx.rollback()
      return this.logAndRespond(error, response, 'store', 'Error creating post.')
    }
  }

async show({ params, response }) {
  try {
    const post = await Post.findOrFail(params.id)
    const rawPost = post.toJSON()
    const formattedPost = {
      ...rawPost,
      created_at: DateFormatter.toBrazilianDateTime(rawPost.created_at),
      published_at: DateFormatter.toBrazilianDateTime(rawPost.published_at),
      updated_at: DateFormatter.toBrazilianDateTime(rawPost.updated_at)
    }
    return response.json(formattedPost)
  } catch (error) {
    const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 500
    const message = (status === 404) ? 'Post not found.' : 'Error fetching post.'
    return this.logAndRespond(error, response, 'show', message, status)
  }
}

  async update({ params, request, response }) {
    try {
      const post = await Post.findOrFail(params.id)
      const data = request.only(['category', 'title', 'description', 'published_at', 'author'])
      const coverFile = request.file('cover_image', { types: ['image'], size: '20mb' })
      if (coverFile) {
        try {
          if (post.cover_image) {
            await this.deleteImageIfExists(post.cover_image)
          }
          const fileName = `${uuid()}.jpg`
          const outputPath = Helpers.publicPath(`uploads/${fileName}`)
          await sharp(coverFile.tmpPath)
            .resize(800, 600, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toFile(outputPath)
          data.cover_image = `/uploads/${fileName}`
        } catch (imgError) {
          console.error('Image processing error:', imgError)
          return response.status(500).json({ message: 'Failed to process image.' })
        }
      }
      post.merge(data)
      await post.save()
      return response.json(post)
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 400
      const message = (status === 404) ? 'Post not found.' : 'Error updating post.'
      return this.logAndRespond(error, response, 'update', message, status)
    }
  }

  async destroy({ params, response }) {
    try {
      const post = await Post.findOrFail(params.id)
      if (post.cover_image) {
        await this.deleteImageIfExists(post.cover_image)
      }
      await post.delete()
      return response.json({ message: 'Post deleted succesfully.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 500
      const message = (status === 404) ? 'Post do not foun.' : 'Error deleting post.'
      return this.logAndRespond(error, response, 'destroy', message, status)
    }
  }

  async deleteImageIfExists(relativePath) {
    try {
      const imagePath = path.join(Helpers.publicPath(), relativePath.replace(/^\/+/, ''))
      await fs.access(imagePath)
      await fs.unlink(imagePath)
    } catch (err) {
      console.warn(`Failed to deleted image: ${relativePath}`, err.message)
    }
  }

  /**
   * Private: Centralized error logger and response
   */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: 'PostController',
      function: func,
      message: error.message
    })
    console.error(`Error in ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = PostController
