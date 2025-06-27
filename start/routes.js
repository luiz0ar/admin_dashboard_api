'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')


Route.post('/login', 'UserController.login')
Route.post('/logout', 'UserController.logout')

Route.post('permissionRole', 'RoleController.permissionRole')
Route.post('deletepermissionRole', 'RoleController.deletepermissionRole')
Route.post('roleToUser', 'RoleController.roleToUser')
Route.post('deleteRoleToUser', 'RoleController.deleteRoleFromUser')

Route.get('/auth/me', 'UserController.auth').middleware(['auth'])
Route.resource('menu-structure', 'MenuStructureController').apiOnly()
Route.resource('users', 'UserController').apiOnly()
Route.resource('events', 'EventController').apiOnly()
Route.resource('alerts', 'AlertController').apiOnly()
Route.resource('banners', 'BannerController').apiOnly()
Route.resource('posts', 'PostController').apiOnly().middleware(['auth'])
Route.resource('categories', 'CategoryController').apiOnly().middleware(['auth'])
Route.resource('unities', 'UnityController').apiOnly()
Route.resource('magazines', 'MaganizeController').apiOnly()
Route.resource('partners', 'PartnerController').apiOnly()
Route.resource('permissions', 'PermissionController').apiOnly()
Route.resource('roles', 'RoleController').apiOnly()

// -------------------------------------------------------------------------------------

Route.post('upload-image', 'UploadController.upload')

Route.get('/uploads/:folder/:file', async ({ params, response }) => {
  const { folder, file } = params
  const filePath = Helpers.publicPath(`uploads/${folder}/${file}`)
  if (!fs.existsSync(filePath)) {
    return response.status(404).send('Arquivo não encontrado')
  }
  return response.download(filePath)
})
