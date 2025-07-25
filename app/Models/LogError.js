'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class LogError extends Model {
    static get table() {
      return 'log_errors'
    }
  }

module.exports = LogError
