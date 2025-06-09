'use strict'

const Schema = use('Schema')

class PostsTableSchema extends Schema {
  up () {
    this.create('posts', (table) => {
      table.increments()

      table.string('cover_image').nullable()
      table.string('category', 100).notNullable()
      table.string('title', 255).notNullable()
      table.string('subtitle', 255).nullable()
      table.string('author', 100).notNullable()
      table.longText('description').notNullable()
      table.timestamp('published_at').defaultTo(this.fn.now())
      table.timestamps()
    })
  }

  down () {
    this.drop('posts')
  }
}

module.exports = PostsTableSchema
