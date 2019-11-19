const Dialog = require('./dialog')
const os = require('os')

class InputDialog extends Dialog {
  constructor (terminalView) {
    super({
      prompt: 'Insert Text',
      iconClass: 'icon-keyboard',
      stayOpen: true
    })

    this.terminalView = terminalView
  }

  onConfirm (input) {
    let eol
    if (atom.config.get('terminus.toggles.runInsertedText')) {
      eol = os.EOL
    } else {
      eol = ''
    }

    const data = `${input}${eol}`
    this.terminalView.input(data)
    this.cancel()
  }
}

module.exports = InputDialog
