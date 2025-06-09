'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Post extends Model {
  static get table() {
    return 'posts'
  }

  static get primaryKey() {
    return 'id'
  }

  static get fillable() {
    return ['cover', 'category', 'title', 'subtitle', 'description', 'published_at', 'author'];
  }

  static get createdAtColumn() {
    return 'created_at'
  }

  static get updatedAtColumn() {
    return 'updated_at'
  }

  static get dates() {
    return super.dates.concat(['published_at'])
  }
}

module.exports = Post
