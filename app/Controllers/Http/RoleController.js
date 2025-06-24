'use strict'

const User = use('App/Models/User')
const Role = use('App/Models/Role')
const LogError = use('App/Models/LogError')

class RoleController {
  async index({ response }) {
    try {
      const roles = await Role.query().with('permissions').fetch()
      return response.json(roles)
    } catch (error) {
      return this.logAndRespond(error, response, 'index', 'Erro ao listar roles.')
    }
  }

  async show({ params, response }) {
    try {
      const role = await Role.findOrFail(params.id)
      await role.load('permissions')
      return response.json(role)
    } catch (error) {
      return this.logAndRespond(error, response, 'show', 'Role não encontrada.', 404)
    }
  }

  async store({ request, response }) {
    try {
      const data = request.only(['name', 'slug', 'description', 'permissions'])
      const role = await Role.create(data)

      if (Array.isArray(data.permissions)) {
        await role.permissions().attach(data.permissions)
      }

      await role.load('permissions')
      return response.json(role)
    } catch (error) {
      return this.logAndRespond(error, response, 'store', 'Erro ao criar role.')
    }
  }

  async update({ request, params, response }) {
    try {
      const data = request.only(['name', 'slug', 'description', 'permissions'])
      const role = await Role.findOrFail(params.id)

      role.merge(data)
      await role.save()

      if (Array.isArray(data.permissions)) {
        await role.permissions().sync(data.permissions)
      }

      await role.load('permissions')
      return response.json(role)
    } catch (error) {
      return this.logAndRespond(error, response, 'update', 'Erro ao atualizar role.')
    }
  }

  async destroy({ params, response }) {
    try {
      const role = await Role.findOrFail(params.id)
      await role.delete()
      return response.json({ message: 'Role deletada com sucesso.' })
    } catch (error) {
      const status = (error.name === 'ModelNotFoundException' || error.code === 'E_MISSING_DATABASE_ROW') ? 404 : 500
      const msg = (status === 404) ? 'Role não encontrada.' : 'Erro interno.'
      return this.logAndRespond(error, response, 'destroy', msg, status)
    }
  }

  async permissionRole({ request, response }) {
    try {
      const { role, permission } = request.only(['role', 'permission'])
      const roleAdmin = await Role.findOrFail(role)
      await roleAdmin.permissions().attach(permission)
      return response.json({ message: 'Permissão adicionada ao cargo.' })
    } catch (error) {
      return this.logAndRespond(error, response, 'permissionRole', 'Erro ao adicionar permissão.')
    }
  }

  async deletepermissionRole({ request, response }) {
    try {
      const { role, permission } = request.only(['role', 'permission'])
      const roleAdmin = await Role.findOrFail(role)
      await roleAdmin.permissions().detach(permission)
      return response.json({ message: 'Permissão removida do cargo.' })
    } catch (error) {
      return this.logAndRespond(error, response, 'deletepermissionRole', 'Erro ao remover permissão.')
    }
  }

  async roleToUser({ request, response }) {
    try {
      const userId = request.input('id')
      const roleId = request.input('role')

      if (!userId || !roleId) {
        return response.status(400).json({ message: 'ID de usuário e ID de role são obrigatórios.' })
      }

      const user = await User.findOrFail(userId)
      await user.roles().attach(roleId)

      return response.json({ message: 'Role adicionada ao usuário com sucesso.' })
    } catch (error) {
      return this.logAndRespond(error, response, 'roleToUser', 'Erro ao adicionar role ao usuário.')
    }
  }

  async deleteRoleFromUser({ request, response }) {
    try {
      const userId = request.input('id')
      const roleId = request.input('role')

      if (!userId || !roleId) {
        return response.status(400).json({ message: 'ID de usuário e ID da role são obrigatórios.' })
      }

      const user = await User.findOrFail(userId)
      await user.roles().detach(roleId)

      return response.json({ message: 'Role removida do usuário com sucesso.' })
    } catch (error) {
      return this.logAndRespond(error, response, 'deleteRoleFromUser', 'Erro ao remover role do usuário.')
    }
  }


/**
  * Private helper for logging errors and sending JSON response
  */
  async logAndRespond(error, response, func, message, status = 500) {
    await LogError.create({
      jsonError: JSON.stringify(error),
      controller: "RoleController",
      function: func,
      message: error.message
    })
    console.error(`Erro em ${func}:`, error.message)
    return response.status(status).json({ message })
  }
}

module.exports = RoleController
