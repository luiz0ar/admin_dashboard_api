const Redis = require('ioredis')
const Env = use('Env')

const redis = new Redis({
  host: Env.get('REDIS_HOST'),
  port: Env.get('REDIS_PORT'),
  password: Env.get('REDIS_PASSWORD') || null,
  db: Env.get('REDIS_DB') || 0,
})

module.exports = redis
