'use strict'

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | JSON Parser
  |--------------------------------------------------------------------------
  |
  | Configurações para quando o corpo da requisição contém JSON.
  |
  */
  json: {
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report'
    ]
  },

  /*
  |--------------------------------------------------------------------------
  | Raw Parser
  |--------------------------------------------------------------------------
  |
  | Parser para texto puro.
  |
  */
  raw: {
    types: ['text/*']
  },

  /*
  |--------------------------------------------------------------------------
  | Form Parser
  |--------------------------------------------------------------------------
  |
  | Parser para formulários padrão (URL encoded).
  |
  */
  form: {
    types: ['application/x-www-form-urlencoded']
  },

  /*
  |--------------------------------------------------------------------------
  | Files Parser
  |--------------------------------------------------------------------------
  |
  | Parser para uploads de arquivos. Esta configuração permite o uso
  | de `request.file(...)` em rotas que recebem arquivos multipart.
  |
  */
  files: {
    types: ['multipart/form-data'],
    maxSize: '20mb',
    autoProcess: true,
    processManually: [], // ✅ vírgula adicionada aqui para manter o objeto válido

    /*
    |----------------------------------------------------------------------
    | tmpFileName (opcional)
    |----------------------------------------------------------------------
    | Você pode definir uma função para gerar nomes temporários de arquivos.
    |
    | Exemplo:
    | tmpFileName () {
    |   return 'arquivo-temporario-unico'
    | }
    */
  }
}
