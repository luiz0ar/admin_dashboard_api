'use strict'

const Model = use('Model')

class Unity extends Model {
  getPhones(value) {
    return value ? JSON.parse(value) : []
  }

  getEmails(value) {
    return value ? JSON.parse(value) : []
  }

  setPhones(value) {
    return JSON.stringify(value || [])
  }

  setEmails(value) {
    return JSON.stringify(value || [])
  }
}

module.exports = Unity
