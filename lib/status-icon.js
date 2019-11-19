let RenameDialog = null

class StatusIcon extends HTMLLIElement {
  constructor (...args) {
    super(...args)
    this.setAttribute('is', 'terminus-status-icon')
  }

  initialize (terminalView) {
    this.terminalView = terminalView
    this.classList.add('terminus-status-icon')

    this.icon = document.createElement('i')
    this.icon.classList.add('icon', 'icon-terminal')
    this.appendChild(this.icon)

    this.name = document.createElement('span')
    this.name.classList.add('name')
    this.appendChild(this.name)

    this.dataset.type = this.terminalView.constructor ? this.terminalView.constructor.name : undefined

    this.addEventListener('click', ({ which }) => {
      if (which === 1) {
        this.terminalView.toggle()
        return true
      } else if (which === 2) {
        this.terminalView.destroy()
        return false
      }
    })

    this.setupTooltip()
  }

  setupTooltip () {
    const onMouseEnter = event => {
      if (event.detail !== 'terminus') {
        this.updateTooltip()
      }
    }

    this.mouseEnterSubscription = {
      dispose: () => {
        this.removeEventListener('mouseenter', onMouseEnter)
        this.mouseEnterSubscription = null
      }
    }

    this.addEventListener('mouseenter', onMouseEnter)
  }

  updateTooltip () {
    this.removeTooltip()

    const process = this.terminalView.getTerminalTitle()
    if (process) {
      this.tooltip = atom.tooltips.add(this, {
        title: process,
        html: false,
        delay: {
          show: 1000,
          hide: 100
        }
      })
    }

    this.dispatchEvent(new CustomEvent('mouseenter', { bubbles: true, detail: 'terminus' }))
  }

  removeTooltip () {
    if (this.tooltip) { this.tooltip.dispose() }
    this.tooltip = null
  }

  destroy () {
    this.removeTooltip()
    if (this.mouseEnterSubscription) { this.mouseEnterSubscription.dispose() }
    this.remove()
  }

  activate () {
    this.classList.add('active')
    this.active = true
  }

  deactivate () {
    this.classList.remove('active')
    this.active = false
  }

  toggle () {
    if (this.active) {
      this.classList.remove('active')
    } else {
      this.classList.add('active')
    }
    this.active = !this.active
  }

  isActive () {
    return this.active
  }

  rename () {
    if (!RenameDialog) { RenameDialog = require('./rename-dialog') }
    const dialog = new RenameDialog(this)
    dialog.attach()
  }

  getName () {
    return this.name.textContent.substring(1)
  }

  updateName (name) {
    if (name !== this.getName()) {
      if (name) { name = '&nbsp;' + name }
      this.name.innerHTML = name
      this.terminalView.emit('did-change-title')
    }
  }
}

StatusIcon.prototype.active = false

customElements.define('terminus-status-icon', StatusIcon, { extends: 'li' })

module.exports = StatusIcon
