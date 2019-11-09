/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let RenameDialog;
import Dialog from "./dialog";

export default RenameDialog = class RenameDialog extends Dialog {
  constructor(statusIcon) {
    this.statusIcon = statusIcon;
    super({
      prompt: "Rename",
      iconClass: "icon-pencil",
      placeholderText: this.statusIcon.getName()
    });
  }

  onConfirm(newTitle) {
    this.statusIcon.updateName(newTitle.trim());
    return this.cancel();
  }
};
