/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let TerminusView;
const {Task, CompositeDisposable, Emitter} = require('atom');
const {$, View} = require('atom-space-pen-views');

const Pty = require.resolve('./process');
const Terminal = require('term.js');
let InputDialog = null;

const path = require('path');
const os = require('os');

let lastOpenedView = null;
let lastActiveElement = null;

module.exports =
(TerminusView = (function() {
  TerminusView = class TerminusView extends View {
    constructor(...args) {
      super(...args);
      this.setAnimationSpeed = this.setAnimationSpeed.bind(this);
      this.updateToolbarVisibility = this.updateToolbarVisibility.bind(this);
      this.recieveItemOrFile = this.recieveItemOrFile.bind(this);
      this.open = this.open.bind(this);
      this.hide = this.hide.bind(this);
      this.onWindowResize = this.onWindowResize.bind(this);
      this.resizeStarted = this.resizeStarted.bind(this);
      this.resizeStopped = this.resizeStopped.bind(this);
      this.resizePanel = this.resizePanel.bind(this);
      this.focus = this.focus.bind(this);
      this.blur = this.blur.bind(this);
      this.focusTerminal = this.focusTerminal.bind(this);
      this.blurTerminal = this.blurTerminal.bind(this);
    }

    static initClass() {
      this.prototype.animating = false;
      this.prototype.id = '';
      this.prototype.maximized = false;
      this.prototype.opened = false;
      this.prototype.pwd = '';
      this.prototype.windowHeight = $(window).height();
      this.prototype.rowHeight = 20;
      this.prototype.shell = '';
      this.prototype.tabView = false;
    }

    static content() {
      return this.div({class: 'terminus terminal-view', outlet: 'terminusView'}, () => {
        this.div({class: 'panel-divider', outlet: 'panelDivider'});
        this.section({class: 'input-block'}, () => {
          return this.div({outlet: 'toolbar', class: 'btn-toolbar'}, () => {
            this.div({class: 'btn-group'}, () => {
              return this.button({outlet: 'inputBtn', class: 'btn icon icon-keyboard', click: 'inputDialog'});
            });
            return this.div({class: 'btn-group right'}, () => {
              this.button({outlet: 'hideBtn', class: 'btn icon icon-chevron-down', click: 'hide'});
              this.button({outlet: 'maximizeBtn', class: 'btn icon icon-screen-full', click: 'maximize'});
              return this.button({outlet: 'closeBtn', class: 'btn icon icon-x', click: 'destroy'});
            });
          });
        });
        return this.div({class: 'xterm', outlet: 'xterm'});
      });
    }

    static getFocusedTerminal() {
      return Terminal.Terminal.focus;
    }

    initialize(id, pwd, statusIcon, statusBar, shell, args=[], env={}, autoRun=[]) {
      this.id = id;
      this.pwd = pwd;
      this.statusIcon = statusIcon;
      this.statusBar = statusBar;
      this.shell = shell;
      this.args = args;
      this.env = env;
      this.autoRun = autoRun;
      this.subscriptions = new CompositeDisposable;
      this.emitter = new Emitter;

      this.subscriptions.add(atom.tooltips.add(this.closeBtn,
        {title: 'Close'})
      );
      this.subscriptions.add(atom.tooltips.add(this.hideBtn,
        {title: 'Hide'})
      );
      this.subscriptions.add(this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn,
        {title: 'Fullscreen'})
      );
      this.inputBtn.tooltip = atom.tooltips.add(this.inputBtn,
        {title: 'Insert Text'});

      this.prevHeight = atom.config.get('terminus.style.defaultPanelHeight');
      if (this.prevHeight.indexOf('%') > 0) {
        const percent = Math.abs(Math.min(parseFloat(this.prevHeight) / 100.0, 1));
        const bottomHeight = $('atom-panel.bottom').children(".terminal-view").height() || 0;
        this.prevHeight = percent * ($('.item-views').height() + bottomHeight);
      }
      this.xterm.height(0);

      this.setAnimationSpeed();
      this.subscriptions.add(atom.config.onDidChange('terminus.style.animationSpeed', this.setAnimationSpeed));

      this.updateToolbarVisibility();
      this.subscriptions.add(atom.config.onDidChange('terminus.toggles.showToolbar', this.updateToolbarVisibility));

      const override = function(event) {
        if (event.originalEvent.dataTransfer.getData('terminus') === 'true') { return; }
        event.preventDefault();
        return event.stopPropagation();
      };

      this.xterm.on('mouseup', event => {
        if (event.which !== 3) {
          let text = window.getSelection().toString();
          if (atom.config.get('terminus.toggles.selectToCopy') && text) {
            const rawLines = text.split(/\r?\n/g);
            const lines = rawLines.map(line => line.replace(/\s/g, " ").trimRight());
            text = lines.join("\n");
            atom.clipboard.write(text);
          }
          if (!text) {
            return this.focus();
          }
        }
      });
      this.xterm.on('dragenter', override);
      this.xterm.on('dragover', override);
      this.xterm.on('drop', this.recieveItemOrFile);

      this.on('focus', this.focus);
      this.subscriptions.add({dispose: () => {
        return this.off('focus', this.focus);
      }
      });

      if (/zsh|bash/.test(this.shell) && (this.args.indexOf('--login') === -1) && (Pty.platform !== 'win32') && atom.config.get('terminus.toggles.loginShell')) {
        return this.args.unshift('--login');
      }
    }

    attach() {
      if (this.panel != null) { return; }
      return this.panel = atom.workspace.addBottomPanel({item: this, visible: false});
    }

    setAnimationSpeed() {
      this.animationSpeed = atom.config.get('terminus.style.animationSpeed');
      if (this.animationSpeed === 0) { this.animationSpeed = 100; }

      return this.xterm.css('transition', `height ${0.25 / this.animationSpeed}s linear`);
    }

    updateToolbarVisibility() {
      this.showToolbar = atom.config.get('terminus.toggles.showToolbar');
      if (this.showToolbar) {
        return this.toolbar.css('display', 'block');
      } else {
        return this.toolbar.css('display', 'none');
      }
    }

    recieveItemOrFile(event) {
      let filePath;
      event.preventDefault();
      event.stopPropagation();
      const {dataTransfer} = event.originalEvent;

      if (dataTransfer.getData('atom-event') === 'true') {
        filePath = dataTransfer.getData('text/plain');
        if (filePath) { return this.input(`${filePath} `); }
      } else if (filePath = dataTransfer.getData('initialPath')) {
        return this.input(`${filePath} `);
      } else if (dataTransfer.files.length > 0) {
        return dataTransfer.files.map((file) =>
          this.input(`${file.path} `));
      }
    }

    forkPtyProcess() {
      return Task.once(Pty, path.resolve(this.pwd), this.shell, this.args, this.env, () => {
        this.input = function() {};
        return this.resize = function() {};
      });
    }

    getId() {
      return this.id;
    }

    displayTerminal() {
      const {cols, rows} = this.getDimensions();
      this.ptyProcess = this.forkPtyProcess();

      this.terminal = new Terminal({
        cursorBlink     : false,
        scrollback      : atom.config.get('terminus.core.scrollback'),
        cols, rows
      });

      this.attachListeners();
      this.attachResizeEvents();
      this.attachWindowEvents();
      return this.terminal.open(this.xterm.get(0));
    }

    attachListeners() {
      this.ptyProcess.on("terminus:data", data => {
        return this.terminal.write(data);
      });

      this.ptyProcess.on("terminus:exit", () => {
        if (atom.config.get('terminus.toggles.autoClose')) { return this.destroy(); }
      });

      this.terminal.end = () => this.destroy();

      this.terminal.on("data", data => {
        return this.input(data);
      });

      this.ptyProcess.on("terminus:title", title => {
        return this.process = title;
      });
      this.terminal.on("title", title => {
        return this.title = title;
      });

      return this.terminal.once("open", () => {
        this.applyStyle();
        this.resizeTerminalToView();

        if (this.ptyProcess.childProcess == null) { return; }
        const autoRunCommand = atom.config.get('terminus.core.autoRunCommand');
        if (autoRunCommand) { this.input(`${autoRunCommand}${os.EOL}`); }
        return this.autoRun.map((command) => this.input(`${command}${os.EOL}`));
      });
    }

    destroy() {
      this.subscriptions.dispose();
      this.statusIcon.destroy();
      this.statusBar.removeTerminalView(this);
      this.detachResizeEvents();
      this.detachWindowEvents();

      if (this.panel.isVisible()) {
        this.hide();
        this.onTransitionEnd(() => this.panel.destroy());
      } else {
        this.panel.destroy();
      }

      if (this.statusIcon && this.statusIcon.parentNode) {
        this.statusIcon.parentNode.removeChild(this.statusIcon);
      }

      if (this.ptyProcess != null) {
        this.ptyProcess.terminate();
      }
      return (this.terminal != null ? this.terminal.destroy() : undefined);
    }

    maximize() {
      this.subscriptions.remove(this.maximizeBtn.tooltip);
      this.maximizeBtn.tooltip.dispose();

      this.maxHeight = this.prevHeight + atom.workspace.getCenter().paneContainer.element.offsetHeight;
      const btn = this.maximizeBtn.children('span');
      this.onTransitionEnd(() => this.focus());

      if (this.maximized) {
        this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn,
          {title: 'Fullscreen'});
        this.subscriptions.add(this.maximizeBtn.tooltip);
        this.adjustHeight(this.prevHeight);
        btn.removeClass('icon-screen-normal').addClass('icon-screen-full');
        return this.maximized = false;
      } else {
        this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn,
          {title: 'Normal'});
        this.subscriptions.add(this.maximizeBtn.tooltip);
        this.adjustHeight(this.maxHeight);
        btn.removeClass('icon-screen-full').addClass('icon-screen-normal');
        return this.maximized = true;
      }
    }

    open() {
      if (lastActiveElement == null) { lastActiveElement = $(document.activeElement); }

      if (lastOpenedView && (lastOpenedView !== this)) {
        if (lastOpenedView.maximized) {
          this.subscriptions.remove(this.maximizeBtn.tooltip);
          this.maximizeBtn.tooltip.dispose();
          const icon = this.maximizeBtn.children('span');

          this.maxHeight = lastOpenedView.maxHeight;
          this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn,
            {title: 'Normal'});
          this.subscriptions.add(this.maximizeBtn.tooltip);
          icon.removeClass('icon-screen-full').addClass('icon-screen-normal');
          this.maximized = true;
        }
        lastOpenedView.hide();
      }

      lastOpenedView = this;
      this.statusBar.setActiveTerminalView(this);
      this.statusIcon.activate();

      this.onTransitionEnd(() => {
        if (!this.opened) {
          this.opened = true;
          this.displayTerminal();
          this.prevHeight = this.nearestRow(this.xterm.height());
          this.xterm.height(this.prevHeight);
          return this.emit("terminus:terminal-open");
        } else {
          return this.focus();
        }
      });

      this.panel.show();
      this.xterm.height(0);
      this.animating = true;
      return this.xterm.height(this.maximized ? this.maxHeight : this.prevHeight);
    }

    hide() {
      if (this.terminal != null) {
        this.terminal.blur();
      }
      lastOpenedView = null;
      this.statusIcon.deactivate();

      this.onTransitionEnd(() => {
        this.panel.hide();
        if (lastOpenedView == null) {
          if (lastActiveElement != null) {
            lastActiveElement.focus();
            return lastActiveElement = null;
          }
        }
      });

      this.xterm.height(this.maximized ? this.maxHeight : this.prevHeight);
      this.animating = true;
      return this.xterm.height(0);
    }

    toggle() {
      if (this.animating) { return; }

      if (this.panel.isVisible()) {
        return this.hide();
      } else {
        return this.open();
      }
    }

    input(data) {
      if (this.ptyProcess.childProcess == null) { return; }

      this.terminal.stopScrolling();
      return this.ptyProcess.send({event: 'input', text: data});
    }

    resize(cols, rows) {
      if (this.ptyProcess.childProcess == null) { return; }

      return this.ptyProcess.send({event: 'resize', rows, cols});
    }

    pty() {
      if (!this.opened) {
        const wait = new Promise((resolve, reject) => {
          this.emitter.on("terminus:terminal-open", () => {
            return resolve();
          });
          return setTimeout(reject, 1000);
        });

        return wait.then(() => {
          return this.ptyPromise();
        });
      } else {
        return this.ptyPromise();
      }
    }

    ptyPromise() {
      return new Promise((resolve, reject) => {
        if (this.ptyProcess != null) {
          this.ptyProcess.on("terminus:pty", pty => {
            return resolve(pty);
          });
          this.ptyProcess.send({event: 'pty'});
          return setTimeout(reject, 1000);
        } else {
          return reject();
        }
      });
    }

    applyStyle() {
      let ref;
      const config = atom.config.get('terminus');

      this.xterm.addClass(config.style.theme);

      this.subscriptions.add(atom.config.onDidChange('terminus.style.theme', event => {
        this.xterm.removeClass(event.oldValue);
        return this.xterm.addClass(event.newValue);
      })
      );

      if (config.toggles.cursorBlink) { this.xterm.addClass('cursor-blink'); }

      let editorFont = atom.config.get('editor.fontFamily');
      const defaultFont = "Menlo, Consolas, 'DejaVu Sans Mono', monospace";
      let overrideFont = config.style.fontFamily;
      this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;

      this.subscriptions.add(atom.config.onDidChange('editor.fontFamily', event => {
        editorFont = event.newValue;
        return this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
      })
      );
      this.subscriptions.add(atom.config.onDidChange('terminus.style.fontFamily', event => {
        overrideFont = event.newValue;
        return this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
      })
      );

      let editorFontSize = atom.config.get('editor.fontSize');
      let overrideFontSize = config.style.fontSize;
      this.terminal.element.style.fontSize = `${overrideFontSize || editorFontSize}px`;

      this.subscriptions.add(atom.config.onDidChange('editor.fontSize', event => {
        editorFontSize = event.newValue;
        this.terminal.element.style.fontSize = `${overrideFontSize || editorFontSize}px`;
        return this.resizeTerminalToView();
      })
      );
      this.subscriptions.add(atom.config.onDidChange('terminus.style.fontSize', event => {
        overrideFontSize = event.newValue;
        this.terminal.element.style.fontSize = `${overrideFontSize || editorFontSize}px`;
        return this.resizeTerminalToView();
      })
      );

      // first 8 colors i.e. 'dark' colors
      this.terminal.colors.splice(0, 7 + 1, ...[].concat([
        config.ansiColors.normal.black.toHexString(),
        config.ansiColors.normal.red.toHexString(),
        config.ansiColors.normal.green.toHexString(),
        config.ansiColors.normal.yellow.toHexString(),
        config.ansiColors.normal.blue.toHexString(),
        config.ansiColors.normal.magenta.toHexString(),
        config.ansiColors.normal.cyan.toHexString(),
        config.ansiColors.normal.white.toHexString()
      ]));
      // 'bright' colors
      return ref = [
        config.ansiColors.zBright.brightBlack.toHexString(),
        config.ansiColors.zBright.brightRed.toHexString(),
        config.ansiColors.zBright.brightGreen.toHexString(),
        config.ansiColors.zBright.brightYellow.toHexString(),
        config.ansiColors.zBright.brightBlue.toHexString(),
        config.ansiColors.zBright.brightMagenta.toHexString(),
        config.ansiColors.zBright.brightCyan.toHexString(),
        config.ansiColors.zBright.brightWhite.toHexString()
      ], this.terminal.colors.splice(8, 15 - 8 + 1, ...[].concat(ref)), ref;
    }

    attachWindowEvents() {
      return $(window).on('resize', this.onWindowResize);
    }

    detachWindowEvents() {
      return $(window).off('resize', this.onWindowResize);
    }

    attachResizeEvents() {
      return this.panelDivider.on('mousedown', this.resizeStarted);
    }

    detachResizeEvents() {
      return this.panelDivider.off('mousedown');
    }

    onWindowResize() {
      if (!this.tabView) {
        let clamped;
        this.xterm.css('transition', '');
        const newHeight = $(window).height();
        const bottomPanel = $('atom-panel-container.bottom').first().get(0);
        const overflow = bottomPanel.scrollHeight - bottomPanel.offsetHeight;

        const delta = newHeight - this.windowHeight;
        this.windowHeight = newHeight;

        if (this.maximized) {
          clamped = Math.max(this.maxHeight + delta, this.rowHeight);

          if (this.panel.isVisible()) { this.adjustHeight(clamped); }
          this.maxHeight = clamped;

          this.prevHeight = Math.min(this.prevHeight, this.maxHeight);
        } else if (overflow > 0) {
          clamped = Math.max(this.nearestRow(this.prevHeight + delta), this.rowHeight);

          if (this.panel.isVisible()) { this.adjustHeight(clamped); }
          this.prevHeight = clamped;
        }

        this.xterm.css('transition', `height ${0.25 / this.animationSpeed}s linear`);
      }
      return this.resizeTerminalToView();
    }

    resizeStarted() {
      if (this.maximized) { return; }
      this.maxHeight = this.prevHeight + $('.item-views').height();
      $(document).on('mousemove', this.resizePanel);
      $(document).on('mouseup', this.resizeStopped);
      return this.xterm.css('transition', '');
    }

    resizeStopped() {
      $(document).off('mousemove', this.resizePanel);
      $(document).off('mouseup', this.resizeStopped);
      return this.xterm.css('transition', `height ${0.25 / this.animationSpeed}s linear`);
    }

    nearestRow(value) {
      const rows = Math.floor(value / this.rowHeight);
      return rows * this.rowHeight;
    }

    resizePanel(event) {
      if (event.which !== 1) { return this.resizeStopped(); }

      const mouseY = $(window).height() - event.pageY;
      const delta = mouseY - $('atom-panel-container.bottom').height() - $('atom-panel-container.footer').height();
      if (Math.abs(delta) <= ((this.rowHeight * 5) / 6)) { return; }

      const clamped = Math.max(this.nearestRow(this.prevHeight + delta), this.rowHeight);
      if (clamped > this.maxHeight) { return; }

      this.xterm.height(clamped);
      $(this.terminal.element).height(clamped);
      this.prevHeight = clamped;

      return this.resizeTerminalToView();
    }

    adjustHeight(height) {
      this.xterm.height(height);
      return $(this.terminal.element).height(height);
    }

    copy() {
      let text;
      if (this.terminal._selected) {
        const textarea = this.terminal.getCopyTextarea();
        text = this.terminal.grabText(
          this.terminal._selected.x1, this.terminal._selected.x2,
          this.terminal._selected.y1, this.terminal._selected.y2);
      } else {
        const rawText = this.terminal.context.getSelection().toString();
        const rawLines = rawText.split(/\r?\n/g);
        const lines = rawLines.map(line => line.replace(/\s/g, " ").trimRight());
        text = lines.join("\n");
      }
      return atom.clipboard.write(text);
    }

    paste() {
      return this.input(atom.clipboard.read());
    }

    insertSelection(customText) {
      let cursor, editor, selection;
      if (!(editor = atom.workspace.getActiveTextEditor())) { return; }
      const runCommand = atom.config.get('terminus.toggles.runInsertedText');
      let selectionText = '';
      if (selection = editor.getSelectedText()) {
        this.terminal.stopScrolling();
        selectionText = selection;
      } else if (cursor = editor.getCursorBufferPosition()) {
        const line = editor.lineTextForBufferRow(cursor.row);
        this.terminal.stopScrolling();
        selectionText = line;
        editor.moveDown(1);
      }
      return this.input(`${customText.
        replace(/\$L/, `${editor.getCursorBufferPosition().row + 1}`).
        replace(/\$F/, path.basename(editor.buffer.getPath() ? editor.buffer.getPath() : '.')).
        replace(/\$D/, path.dirname(editor.buffer.getPath() ? editor.buffer.getPath() : '.')).
        replace(/\$S/, selectionText).
        replace(/\$\$/, '$')}${runCommand ? os.EOL : ''}`
      );
    }

    focus(fromWindowEvent) {
      this.resizeTerminalToView();
      this.focusTerminal(fromWindowEvent);
      this.statusBar.setActiveTerminalView(this);
      return super.focus();
    }

    blur() {
      this.blurTerminal();
      return super.blur();
    }

    focusTerminal(fromWindowEvent) {
      if (!this.terminal) { return; }

      lastActiveElement = $(document.activeElement);
      if (fromWindowEvent && !(lastActiveElement.is('div.terminal') || lastActiveElement.parents('div.terminal').length)) { return; }

      this.terminal.focus();
      if (this.terminal._textarea) {
        return this.terminal._textarea.focus();
      } else {
        return this.terminal.element.focus();
      }
    }

    blurTerminal() {
      if (!this.terminal) { return; }

      this.terminal.blur();
      this.terminal.element.blur();

      if (lastActiveElement != null) {
        return lastActiveElement.focus();
      }
    }

    resizeTerminalToView() {
      if (!this.panel.isVisible() && !this.tabView) { return; }

      const {cols, rows} = this.getDimensions();
      if ((cols <= 0) || (rows <= 0)) { return; }
      if (!this.terminal) { return; }
      if ((this.terminal.rows === rows) && (this.terminal.cols === cols)) { return; }

      this.resize(cols, rows);
      return this.terminal.resize(cols, rows);
    }

    getDimensions() {
      let cols, rows;
      const fakeRow = $("<div><span>&nbsp;</span></div>");

      if (this.terminal) {
        this.find('.terminal').append(fakeRow);
        const fakeCol = fakeRow.children().first()[0].getBoundingClientRect();
        cols = Math.floor(this.xterm.width() / (fakeCol.width || 9));
        rows = Math.floor(this.xterm.height() / (fakeCol.height || 20));
        this.rowHeight = fakeCol.height;
        fakeRow.remove();
      } else {
        cols = Math.floor(this.xterm.width() / 9);
        rows = Math.floor(this.xterm.height() / 20);
      }

      return {cols, rows};
    }

    onTransitionEnd(callback) {
      return this.xterm.one('webkitTransitionEnd', () => {
        callback();
        return this.animating = false;
      });
    }

    inputDialog() {
      if (InputDialog == null) { InputDialog = require('./input-dialog'); }
      const dialog = new InputDialog(this);
      return dialog.attach();
    }

    rename() {
      return this.statusIcon.rename();
    }

    toggleTabView() {
      if (this.tabView) {
        this.panel = atom.workspace.addBottomPanel({item: this, visible: false});
        this.attachResizeEvents();
        this.closeBtn.show();
        this.hideBtn.show();
        this.maximizeBtn.show();
        return this.tabView = false;
      } else {
        this.panel.destroy();
        this.detachResizeEvents();
        this.closeBtn.hide();
        this.hideBtn.hide();
        this.maximizeBtn.hide();
        this.xterm.css("height", "");
        this.tabView = true;
        if (lastOpenedView === this) { return lastOpenedView = null; }
      }
    }

    getTitle() {
      return this.statusIcon.getName() || "terminus";
    }

    getIconName() {
      return "terminal";
    }

    getShell() {
      return path.basename(this.shell);
    }

    getShellPath() {
      return this.shell;
    }

    emit(event, data) {
      return this.emitter.emit(event, data);
    }

    onDidChangeTitle(callback) {
      return this.emitter.on('did-change-title', callback);
    }

    getPath() {
      return this.getTerminalTitle();
    }

    getTerminalTitle() {
      return this.title || this.process;
    }

    getTerminal() {
      return this.terminal;
    }

    isAnimating() {
      return this.animating;
    }
  };
  TerminusView.initClass();
  return TerminusView;
})());