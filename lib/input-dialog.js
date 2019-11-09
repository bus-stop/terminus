/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let InputDialog;
import Dialog from "./dialog";
import os from "os";

export default InputDialog = class InputDialog extends Dialog {
  constructor(terminalView) {
    this.terminalView = terminalView;
    super({
      prompt: "Insert Text",
      iconClass: "icon-keyboard",
      stayOpen: true
    });
  }

  onConfirm(input) {
    let eol;
    if (atom.config.get('terminus.toggles.runInsertedText')) {
      eol = os.EOL;
    } else {
      eol = '';
    }

    const data = `${input}${eol}`;
    this.terminalView.input(data);
    return this.cancel();
  }
};
