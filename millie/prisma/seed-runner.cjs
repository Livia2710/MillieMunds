require('ts-node').register({
  compilerOptions: { module: 'CommonJS' },
})

require('./seed.ts')
