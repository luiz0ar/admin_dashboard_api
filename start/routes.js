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

Route.get('/auth/me', 'UserController.auth').middleware(['auth'])
Route.resource('users', 'UserController').apiOnly().middleware(['auth'])
Route.resource('posts', 'PostController').apiOnly().middleware(['auth'])
Route.resource('categories', 'CategoryController').apiOnly().middleware(['auth'])
