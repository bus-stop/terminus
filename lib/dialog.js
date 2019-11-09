/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Dialog;
import { TextEditorView, View } from 'atom-space-pen-views';

export default Dialog = class Dialog extends View {
  static content({prompt} = {}) {
    return this.div({class: 'terminus-dialog'}, () => {
      this.label(prompt, {class: 'icon', outlet: 'promptText'});
      this.subview('miniEditor', new TextEditorView({mini: true}));
      this.label('Escape (Esc) to exit', {style: 'width: 50%;'});
      return this.label('Enter (\u21B5) to confirm', {style: 'width: 50%; text-align: right;'});
    });
  }

  initialize({iconClass, placeholderText, stayOpen} = {}) {
    if (iconClass) { this.promptText.addClass(iconClass); }
    atom.commands.add(this.element, {
      'core:confirm': () => this.onConfirm(this.miniEditor.getText()),
      'core:cancel': () => this.cancel()
    }
    );

    if (!stayOpen) {
      this.miniEditor.on('blur', () => this.close());
    }

    if (placeholderText) {
      this.miniEditor.getModel().setText(placeholderText);
      return this.miniEditor.getModel().selectAll();
    }
  }

  attach() {
    this.panel = atom.workspace.addModalPanel({item: this.element});
    this.miniEditor.focus();
    return this.miniEditor.getModel().scrollToCursorPosition();
  }

  close() {
    const panelToDestroy = this.panel;
    this.panel = null;
    if (panelToDestroy != null) {
      panelToDestroy.destroy();
    }
    return atom.workspace.getActivePane().activate();
  }

  cancel() {
    return this.close();
  }
};
