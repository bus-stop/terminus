/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let StatusBar;
const {CompositeDisposable} = require('atom');
const {$, View} = require('atom-space-pen-views');

const TerminusView = require('./view');
const StatusIcon = require('./status-icon');

const os = require('os');
const path = require('path');
const _ = require('underscore');

module.exports =
(StatusBar = function() {
  StatusBar = class StatusBar extends View {
    constructor(...args) {
      super(...args);
      this.closeAll = this.closeAll.bind(this);
      this.onDragStart = this.onDragStart.bind(this);
      this.onDragLeave = this.onDragLeave.bind(this);
      this.onDragEnd = this.onDragEnd.bind(this);
      this.onDragOver = this.onDragOver.bind(this);
      this.onDrop = this.onDrop.bind(this);
      this.onDropTabBar = this.onDropTabBar.bind(this);
      this.moveTerminalView = this.moveTerminalView.bind(this);
    }

    static initClass() {
      this.prototype.terminalViews = [];
      this.prototype.activeTerminal = null;
      this.prototype.returnFocus = null;
    }

    static content() {
      return this.div({class: 'terminus status-bar', tabindex: -1}, () => {
        this.i({class: "icon icon-plus", click: 'newTerminalView', outlet: 'plusBtn'});
        this.ul({class: "list-inline status-container", tabindex: '-1', outlet: 'statusContainer', is: 'space-pen-ul'});
        return this.i({class: "icon icon-x", click: 'closeAll', outlet: 'closeBtn'});
      });
    }

    initialize(statusBarProvider) {
      this.statusBarProvider = statusBarProvider;
      this.subscriptions = new CompositeDisposable();

      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'terminus:focus': () => this.focusTerminal(),
        'terminus:new': () => this.newTerminalView(),
        'terminus:toggle': () => this.toggle(),
        'terminus:next': () => {
          if (!this.activeTerminal) { return; }
          if (this.activeTerminal.isAnimating()) { return; }
          if (this.activeNextTerminalView()) { return this.activeTerminal.open(); }
        },
        'terminus:prev': () => {
          if (!this.activeTerminal) { return; }
          if (this.activeTerminal.isAnimating()) { return; }
          if (this.activePrevTerminalView()) { return this.activeTerminal.open(); }
        },
        'terminus:clear': () => this.clear(),
        'terminus:close': () => this.destroyActiveTerm(),
        'terminus:close-all': () => this.closeAll(),
        'terminus:rename': () => this.runInActiveView(i => i.rename()),
        'terminus:insert-selected-text': () => this.runInActiveView(i => i.insertSelection('$S')),
        'terminus:insert-text': () => this.runInActiveView(i => i.inputDialog()),
        'terminus:insert-custom-text-1': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText1'))),
        'terminus:insert-custom-text-2': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText2'))),
        'terminus:insert-custom-text-3': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText3'))),
        'terminus:insert-custom-text-4': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText4'))),
        'terminus:insert-custom-text-5': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText5'))),
        'terminus:insert-custom-text-6': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText6'))),
        'terminus:insert-custom-text-7': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText7'))),
        'terminus:insert-custom-text-8': () => this.runInActiveView(i => i.insertSelection(atom.config.get('terminus.customTexts.customText8'))),
        'terminus:fullscreen': () => this.activeTerminal.maximize()
      }
      )
      );

      this.subscriptions.add(atom.commands.add('.xterm', {
        'terminus:paste': () => this.runInActiveView(i => i.paste()),
        'terminus:copy': () => this.runInActiveView(i => i.copy())
      }
      )
      );

      this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(item => {
        if (item == null) { return; }

        if (item.constructor.name === "TerminusView") {
          return setTimeout(item.focus, 100);
        } else if (item.constructor.name === "TextEditor") {
          let nextTerminal;
          const mapping = atom.config.get('terminus.core.mapTerminalsTo');
          if (mapping === 'None') { return; }
          if (!item.getPath()) { return; }

          switch (mapping) {
            case 'File':
              nextTerminal = this.getTerminalById(item.getPath(), view => view.getId().filePath);
              break;
            case 'Folder':
              nextTerminal = this.getTerminalById(path.dirname(item.getPath()), view => view.getId().folderPath);
              break;
          }

          const prevTerminal = this.getActiveTerminalView();
          if (prevTerminal !== nextTerminal) {
            if ((nextTerminal == null)) {
              if (atom.config.get('terminus.core.mapTerminalsToAutoOpen')) {
                return nextTerminal = this.createTerminalView();
              }
            } else {
              this.setActiveTerminalView(nextTerminal);
              if (prevTerminal != null ? prevTerminal.panel.isVisible() : undefined) { return nextTerminal.toggle(); }
            }
          }
        }
      })
      );

      this.registerContextMenu();

      this.subscriptions.add(atom.tooltips.add(this.plusBtn, {title: 'New Terminal'}));
      this.subscriptions.add(atom.tooltips.add(this.closeBtn, {title: 'Close All'}));

      this.statusContainer.on('dblclick', event => {
        if (event.target === event.delegateTarget) { return this.newTerminalView(); }
      });

      this.statusContainer.on('dragstart', '.terminus-status-icon', this.onDragStart);
      this.statusContainer.on('dragend', '.terminus-status-icon', this.onDragEnd);
      this.statusContainer.on('dragleave', this.onDragLeave);
      this.statusContainer.on('dragover', this.onDragOver);
      this.statusContainer.on('drop', this.onDrop);

      const handleBlur = () => {
        let terminal;
        if (terminal = TerminusView.getFocusedTerminal()) {
          this.returnFocus = this.terminalViewForTerminal(terminal);
          return terminal.blur();
        }
      };

      const handleFocus = () => {
        if (this.returnFocus) {
          return setTimeout(() => {
            if (this.returnFocus != null) {
              this.returnFocus.focus(true);
            }
            return this.returnFocus = null;
          }
          , 100);
        }
      };

      window.addEventListener('blur', handleBlur);
      this.subscriptions.add({dispose() {
        return window.removeEventListener('blur', handleBlur);
      }
      });

      window.addEventListener('focus', handleFocus);
      this.subscriptions.add({dispose() {
        return window.removeEventListener('focus', handleFocus);
      }
      });

      return this.attach();
    }

    registerContextMenu() {
      return this.subscriptions.add(atom.commands.add('.terminus.status-bar', {
        'terminus:status-red': this.setStatusColor,
        'terminus:status-orange': this.setStatusColor,
        'terminus:status-yellow': this.setStatusColor,
        'terminus:status-green': this.setStatusColor,
        'terminus:status-blue': this.setStatusColor,
        'terminus:status-purple': this.setStatusColor,
        'terminus:status-pink': this.setStatusColor,
        'terminus:status-cyan': this.setStatusColor,
        'terminus:status-magenta': this.setStatusColor,
        'terminus:status-default': this.clearStatusColor,
        'terminus:context-close'(event) {
          return $(event.target).closest('.terminus-status-icon')[0].terminalView.destroy();
        },
        'terminus:context-hide'(event) {
          const statusIcon = $(event.target).closest('.terminus-status-icon')[0];
          if (statusIcon.isActive()) { return statusIcon.terminalView.hide(); }
        },
        'terminus:context-rename'(event) {
          return $(event.target).closest('.terminus-status-icon')[0].rename();
        }
      }
      )
      );
    }

    registerPaneSubscription() {
      return this.subscriptions.add(this.paneSubscription = atom.workspace.observePanes(pane => {
        const paneElement = $(atom.views.getView(pane));
        const tabBar = paneElement.find('ul');

        tabBar.on('drop', event => this.onDropTabBar(event, pane));
        tabBar.on('dragstart', function(event) {
          if ((event.target.item != null ? event.target.item.constructor.name : undefined) !== 'TerminusView') { return; }
          return event.originalEvent.dataTransfer.setData('terminus-tab', 'true');
        });
        return pane.onDidDestroy(function() { return tabBar.off('drop', this.onDropTabBar); });
      })
      );
    }

    createTerminalView(autoRun) {
      const shell = atom.config.get('terminus.core.shell');
      const shellArguments = atom.config.get('terminus.core.shellArguments');
      const args = shellArguments.split(/\s+/g).filter(arg => arg);
      const shellEnv = atom.config.get('terminus.core.shellEnv');
      let env = {};
      shellEnv.split(' ').forEach(element => {
        const configVar = element.split('=');
        const envVar = {};
        envVar[configVar[0]] = configVar[1];
        return env = _.extend(env, envVar);
      });
      return this.createEmptyTerminalView(autoRun, shell, args, env);
    }

    createEmptyTerminalView(autoRun=[], shell = null, args = [], env= {}) {
      let editorFolder, pwd;
      if (this.paneSubscription == null) { this.registerPaneSubscription(); }

      let projectFolder = atom.project.getPaths()[0];
      const editorPath = __guard__(atom.workspace.getActiveTextEditor(), x => x.getPath());

      if (editorPath != null) {
        editorFolder = path.dirname(editorPath);
        for (let directory of atom.project.getPaths()) {
          if (editorPath.indexOf(directory) >= 0) {
            projectFolder = directory;
          }
        }
      }

      if ((projectFolder != null ? projectFolder.indexOf('atom://') : undefined) >= 0) { projectFolder = undefined; }

      const home = process.platform === 'win32' ? process.env.HOMEPATH : process.env.HOME;

      switch (atom.config.get('terminus.core.workingDirectory')) {
        case 'Project': pwd = projectFolder || editorFolder || home; break;
        case 'Active File': pwd = editorFolder || projectFolder || home; break;
        default: pwd = home;
      }

      let id = editorPath || projectFolder || home;
      id = {filePath: id, folderPath: path.dirname(id)};

      const statusIcon = new StatusIcon();
      const terminusView = new TerminusView(id, pwd, statusIcon, this, shell, args, env, autoRun);
      statusIcon.initialize(terminusView);

      terminusView.attach();

      this.terminalViews.push(terminusView);
      this.statusContainer.append(statusIcon);
      return terminusView;
    }

    activeNextTerminalView() {
      const index = this.indexOf(this.activeTerminal);
      if (index < 0) { return false; }
      return this.activeTerminalView(index + 1);
    }

    activePrevTerminalView() {
      const index = this.indexOf(this.activeTerminal);
      if (index < 0) { return false; }
      return this.activeTerminalView(index - 1);
    }

    indexOf(view) {
      return this.terminalViews.indexOf(view);
    }

    activeTerminalView(index) {
      if (this.terminalViews.length < 2) { return false; }

      if (index >= this.terminalViews.length) {
        index = 0;
      }
      if (index < 0) {
        index = this.terminalViews.length - 1;
      }

      this.activeTerminal = this.terminalViews[index];
      return true;
    }

    getActiveTerminalView() {
      return this.activeTerminal;
    }

    focusTerminal() {
      let terminal;
      if (this.activeTerminal == null) { return; }

      if ((terminal = TerminusView.getFocusedTerminal())) {
          return this.activeTerminal.blur();
      } else {
          return this.activeTerminal.focusTerminal();
        }
    }

    getTerminalById(target, selector) {
      if (selector == null) { selector = terminal => terminal.id; }

      for (let index = 0, end = this.terminalViews.length, asc = 0 <= end; asc ? index <= end : index >= end; asc ? index++ : index--) {
        const terminal = this.terminalViews[index];
        if (terminal != null) {
          if (selector(terminal) === target) { return terminal; }
        }
      }

      return null;
    }

    terminalViewForTerminal(terminal) {
      for (let index = 0, end = this.terminalViews.length, asc = 0 <= end; asc ? index <= end : index >= end; asc ? index++ : index--) {
        const terminalView = this.terminalViews[index];
        if (terminalView != null) {
          if (terminalView.getTerminal() === terminal) { return terminalView; }
        }
      }

      return null;
    }

    runInActiveView(callback) {
      const view = this.getActiveTerminalView();
      if (view != null) {
        return callback(view);
      }
      return null;
    }

    runNewTerminal() {
      this.activeTerminal = this.createEmptyTerminalView();
      this.activeTerminal.toggle();
      return this.activeTerminal;
    }

    runCommandInNewTerminal(commands) {
      this.activeTerminal = this.createTerminalView(commands);
      return this.activeTerminal.toggle();
    }

    runInOpenView(callback) {
      const view = this.getActiveTerminalView();
      if ((view != null) && view.panel.isVisible()) {
        return callback(view);
      }
      return null;
    }

    setActiveTerminalView(view) {
      return this.activeTerminal = view;
    }

    removeTerminalView(view) {
      const index = this.indexOf(view);
      if (index < 0) { return; }
      this.terminalViews.splice(index, 1);

      return this.activateAdjacentTerminal(index);
    }

    activateAdjacentTerminal(index=0) {
      if (!(this.terminalViews.length > 0)) { return false; }

      index = Math.max(0, index - 1);
      this.activeTerminal = this.terminalViews[index];

      return true;
    }

    newTerminalView() {
      if (this.activeTerminal != null ? this.activeTerminal.animating : undefined) { return; }

      this.activeTerminal = this.createTerminalView();
      return this.activeTerminal.toggle();
    }

    attach() {
      return this.statusBarProvider.addLeftTile({item: this, priority: -93});
    }

    destroyActiveTerm() {
      if (this.activeTerminal == null) { return; }

      const index = this.indexOf(this.activeTerminal);
      this.activeTerminal.destroy();
      this.activeTerminal = null;

      return this.activateAdjacentTerminal(index);
    }

    closeAll() {
      for (let index = this.terminalViews.length, asc = this.terminalViews.length <= 0; asc ? index <= 0 : index >= 0; asc ? index++ : index--) {
        const view = this.terminalViews[index];
        if (view != null) {
          view.destroy();
        }
      }
      return this.activeTerminal = null;
    }

    destroy() {
      this.subscriptions.dispose();
      for (let view of this.terminalViews) {
        view.ptyProcess.terminate();
        view.terminal.destroy();
      }
      return this.detach();
    }

    toggle() {
      if (this.terminalViews.length === 0) {
        this.activeTerminal = this.createTerminalView();
      } else if (this.activeTerminal === null) {
        this.activeTerminal = this.terminalViews[0];
      }
      return this.activeTerminal.toggle();
    }

    clear() {
      this.destroyActiveTerm();
      return this.newTerminalView();
    }

    setStatusColor(event) {
      let color = event.type.match(/\w+$/)[0];
      color = atom.config.get(`terminus.iconColors.${color}`).toRGBAString();
      return $(event.target).closest('.terminus-status-icon').css('color', color);
    }

    clearStatusColor(event) {
      return $(event.target).closest('.terminus-status-icon').css('color', '');
    }

    onDragStart(event) {
      event.originalEvent.dataTransfer.setData('terminus-panel', 'true');

      const element = $(event.target).closest('.terminus-status-icon');
      element.addClass('is-dragging');
      return event.originalEvent.dataTransfer.setData('from-index', element.index());
    }

    onDragLeave(event) {
      return this.removePlaceholder();
    }

    onDragEnd(event) {
      return this.clearDropTarget();
    }

    onDragOver(event) {
      let element;
      event.preventDefault();
      event.stopPropagation();
      if (event.originalEvent.dataTransfer.getData('terminus') !== 'true') {
        return;
      }

      const newDropTargetIndex = this.getDropTargetIndex(event);
      if (newDropTargetIndex == null) { return; }
      this.removeDropTargetClasses();
      const statusIcons = this.statusContainer.children('.terminus-status-icon');

      if (newDropTargetIndex < statusIcons.length) {
        element = statusIcons.eq(newDropTargetIndex).addClass('is-drop-target');
        return this.getPlaceholder().insertBefore(element);
      } else {
        element = statusIcons.eq(newDropTargetIndex - 1).addClass('drop-target-is-after');
        return this.getPlaceholder().insertAfter(element);
      }
    }

    onDrop(event) {
      let fromIndex;
      const {dataTransfer} = event.originalEvent;
      const panelEvent = dataTransfer.getData('terminus-panel') === 'true';
      const tabEvent = dataTransfer.getData('terminus-tab') === 'true';
      if (!panelEvent && !tabEvent) { return; }

      event.preventDefault();
      event.stopPropagation();

      const toIndex = this.getDropTargetIndex(event);
      this.clearDropTarget();

      if (tabEvent) {
        fromIndex = parseInt(dataTransfer.getData('sortable-index'));
        const paneIndex = parseInt(dataTransfer.getData('from-pane-index'));
        const pane = atom.workspace.getPanes()[paneIndex];
        const view = pane.itemAtIndex(fromIndex);
        pane.removeItem(view, false);
        view.show();

        view.toggleTabView();
        this.terminalViews.push(view);
        if (view.statusIcon.isActive()) { view.open(); }
        this.statusContainer.append(view.statusIcon);
        fromIndex = this.terminalViews.length - 1;
      } else {
        fromIndex = parseInt(dataTransfer.getData('from-index'));
      }
      return this.updateOrder(fromIndex, toIndex);
    }

    onDropTabBar(event, pane) {
      const {dataTransfer} = event.originalEvent;
      if (dataTransfer.getData('terminus-panel') !== 'true') { return; }

      event.preventDefault();
      event.stopPropagation();
      this.clearDropTarget();

      const fromIndex = parseInt(dataTransfer.getData('from-index'));
      const view = this.terminalViews[fromIndex];
      view.css("height", "");
      view.terminal.element.style.height = "";
      const tabBar = $(event.target).closest('.tab-bar');

      view.toggleTabView();
      this.removeTerminalView(view);
      this.statusContainer.children().eq(fromIndex).detach();
      view.statusIcon.removeTooltip();

      pane.addItem(view, pane.getItems().length);
      pane.activateItem(view);

      return view.focus();
    }

    clearDropTarget() {
      const element = this.find('.is-dragging');
      element.removeClass('is-dragging');
      this.removeDropTargetClasses();
      return this.removePlaceholder();
    }

    removeDropTargetClasses() {
      this.statusContainer.find('.is-drop-target').removeClass('is-drop-target');
      return this.statusContainer.find('.drop-target-is-after').removeClass('drop-target-is-after');
    }

    getDropTargetIndex(event) {
      const target = $(event.target);
      if (this.isPlaceholder(target)) { return; }

      const statusIcons = this.statusContainer.children('.terminus-status-icon');
      let element = target.closest('.terminus-status-icon');
      if (element.length === 0) { element = statusIcons.last(); }

      if (!element.length) { return 0; }

      const elementCenter = element.offset().left + (element.width() / 2);

      if (event.originalEvent.pageX < elementCenter) {
        return statusIcons.index(element);
      } else if (element.next('.terminus-status-icon').length > 0) {
        return statusIcons.index(element.next('.terminus-status-icon'));
      } else {
        return statusIcons.index(element) + 1;
      }
    }

    getPlaceholder() {
      return this.placeholderEl != null ? this.placeholderEl : (this.placeholderEl = $('<li class="placeholder"></li>'));
    }

    removePlaceholder() {
      if (this.placeholderEl != null) {
        this.placeholderEl.remove();
      }
      return this.placeholderEl = null;
    }

    isPlaceholder(element) {
      return element.is('.placeholder');
    }

    iconAtIndex(index) {
      return this.getStatusIcons().eq(index);
    }

    getStatusIcons() {
      return this.statusContainer.children('.terminus-status-icon');
    }

    moveIconToIndex(icon, toIndex) {
      const followingIcon = this.getStatusIcons()[toIndex];
      const container = this.statusContainer[0];
      if (followingIcon != null) {
        return container.insertBefore(icon, followingIcon);
      } else {
        return container.appendChild(icon);
      }
    }

    moveTerminalView(fromIndex, toIndex) {
      const activeTerminal = this.getActiveTerminalView();
      const view = this.terminalViews.splice(fromIndex, 1)[0];
      this.terminalViews.splice(toIndex, 0, view);
      return this.setActiveTerminalView(activeTerminal);
    }

    updateOrder(fromIndex, toIndex) {
      if (fromIndex === toIndex) { return; }
      if (fromIndex < toIndex) { toIndex--; }

      const icon = this.getStatusIcons().eq(fromIndex).detach();
      this.moveIconToIndex(icon.get(0), toIndex);
      this.moveTerminalView(fromIndex, toIndex);
      icon.addClass('inserted');
      return icon.one('webkitAnimationEnd', () => icon.removeClass('inserted'));
    }
  };
  StatusBar.initClass();
  return StatusBar;
})();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}