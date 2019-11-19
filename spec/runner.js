const { createRunner } = require('atom-jasmine3-test-runner')

module.exports = createRunner({
  random: true,
  specHelper: {
    atom: true,
    attachToDom: true,
    ci: true,
    customMatchers: true
  }
})
