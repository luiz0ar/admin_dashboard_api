'use strict'

const moment = require('moment')

class DateFormatter {
  static toBrazilianDateTime(dateInput) {
    if (!dateInput) return null

    return moment(dateInput).format('DD/MM/YYYY HH:mm')
  }
}

module.exports = DateFormatter
