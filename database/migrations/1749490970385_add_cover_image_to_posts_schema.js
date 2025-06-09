'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCoverImageToPostsSchema extends Schema {
  up () {
    this.create('add_cover_image_to_posts', (table) => {
      table.increments()
      table.string('cover_image').nullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('add_cover_image_to_posts')
  }
}

module.exports = AddCoverImageToPostsSchema
