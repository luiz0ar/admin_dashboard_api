'use strict'

const LogError = use('App/Models/LogErrors')

class LogErrorController {
  async addError({ params, request, response }) {
    try {
      const { solutioned_at } = request.only(['solutioned_at'])
      const errorLog = await LogError.find(params.id)

      if (!errorLog) {
        return response.status(404).json({ message: 'Error log not found.' })
      }

      errorLog.merge({ solutioned_at })
      await errorLog.save()

      return response.json(errorLog)
    } catch (error) {
      console.error('Error updating log error:', error.message)

      return response.status(500).json({ message: 'Error processing the request.' })
    }
  }
}

module.exports = LogErrorController
