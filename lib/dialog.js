const { TextEditorView, View } = require('atom-space-pen-views')

class Dialog extends View {
  static content ({ prompt } = {}) {
    this.div({ class: 'terminus-dialog' }, () => {
      this.label(prompt, { class: 'icon', outlet: 'promptText' })
      this.subview('miniEditor', new TextEditorView({ mini: true }))
      this.label('Escape (Esc) to exit', { style: 'width: 50%;' })
      this.label('Enter (\u21B5) to confirm', { style: 'width: 50%; text-align: right;' })
    })
  }

  initialize ({ iconClass, placeholderText, stayOpen } = {}) {
    if (iconClass) { this.promptText.addClass(iconClass) }
    atom.commands.add(this.element, {
      'core:confirm': () => this.onConfirm(this.miniEditor.getText()),
      'core:cancel': () => this.cancel()
    })

    if (!stayOpen) {
      this.miniEditor.on('blur', () => this.close())
    }

    if (placeholderText) {
      this.miniEditor.getModel().setText(placeholderText)
      this.miniEditor.getModel().selectAll()
    }
  }

  attach () {
    this.panel = atom.workspace.addModalPanel({ item: this.element })
    this.miniEditor.focus()
    this.miniEditor.getModel().scrollToCursorPosition()
  }

  close () {
    const panelToDestroy = this.panel
    this.panel = null
    if (panelToDestroy) {
      panelToDestroy.destroy()
    }
    atom.workspace.getActivePane().activate()
  }

  cancel () {
    this.close()
  }
}

module.exports = Dialog
