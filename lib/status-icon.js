/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let StatusIcon;
const {CompositeDisposable} = require('atom');

let RenameDialog = null;

module.exports =
(StatusIcon = (function() {
  StatusIcon = class StatusIcon extends HTMLElement {
    static initClass() {
      this.prototype.active = false;
    }

    initialize(terminalView) {
      this.terminalView = terminalView;
      this.classList.add('terminus-status-icon');

      this.icon = document.createElement('i');
      this.icon.classList.add('icon', 'icon-terminal');
      this.appendChild(this.icon);

      this.name = document.createElement('span');
      this.name.classList.add('name');
      this.appendChild(this.name);

      this.dataset.type = this.terminalView.constructor != null ? this.terminalView.constructor.name : undefined;

      this.addEventListener('click', ({which, ctrlKey}) => {
        if (which === 1) {
          this.terminalView.toggle();
          return true;
        } else if (which === 2) {
          this.terminalView.destroy();
          return false;
        }
      });

      return this.setupTooltip();
    }

    setupTooltip() {

      const onMouseEnter = event => {
        if (event.detail === 'terminus') { return; }
        return this.updateTooltip();
      };

      this.mouseEnterSubscription = { dispose: () => {
        this.removeEventListener('mouseenter', onMouseEnter);
        return this.mouseEnterSubscription = null;
      }
    };

      return this.addEventListener('mouseenter', onMouseEnter);
    }

    updateTooltip() {
      let process;
      this.removeTooltip();

      if (process = this.terminalView.getTerminalTitle()) {
        this.tooltip = atom.tooltips.add(this, {
          title: process,
          html: false,
          delay: {
            show: 1000,
            hide: 100
          }
        }
        );
      }

      return this.dispatchEvent(new CustomEvent('mouseenter', {bubbles: true, detail: 'terminus'}));
    }

    removeTooltip() {
      if (this.tooltip) { this.tooltip.dispose(); }
      return this.tooltip = null;
    }

    destroy() {
      this.removeTooltip();
      if (this.mouseEnterSubscription) { this.mouseEnterSubscription.dispose(); }
      return this.remove();
    }

    activate() {
      this.classList.add('active');
      return this.active = true;
    }

    isActive() {
      return this.classList.contains('active');
    }

    deactivate() {
      this.classList.remove('active');
      return this.active = false;
    }

    toggle() {
      if (this.active) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
      }
      return this.active = !this.active;
    }

    isActive() {
      return this.active;
    }

    rename() {
      if (RenameDialog == null) { RenameDialog = require('./rename-dialog'); }
      const dialog = new RenameDialog(this);
      return dialog.attach();
    }

    getName() { return this.name.textContent.substring(1); }

    updateName(name) {
      if (name !== this.getName()) {
        if (name) { name = "&nbsp;" + name; }
        this.name.innerHTML = name;
        return this.terminalView.emit('did-change-title');
      }
    }
  };
  StatusIcon.initClass();
  return StatusIcon;
})());

module.exports = document.registerElement('terminus-status-icon', {prototype: StatusIcon.prototype, extends: 'li'});
