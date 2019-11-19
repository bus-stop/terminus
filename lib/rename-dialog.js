const Dialog = require('./dialog')

class RenameDialog extends Dialog {
  constructor (statusIcon) {
    super({
      prompt: 'Rename',
      iconClass: 'icon-pencil',
      placeholderText: statusIcon.getName()
    })

    this.statusIcon = statusIcon
  }

  onConfirm (newTitle) {
    this.statusIcon.updateName(newTitle.trim())
    this.cancel()
  }
}

module.exports = RenameDialog
