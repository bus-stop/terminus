const pty = require('node-pty-prebuilt-multiarch');
const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const child = require('child_process');

function getSystemLanguage() {
  let language = "en_US.UTF-8";
  if (process.platform === 'darwin') {
    try {
      const command = 'plutil -convert json -o - ~/Library/Preferences/.GlobalPreferences.plist';
      language = `${JSON.parse(child.execSync(command).toString()).AppleLocale}.UTF-8`;
    } catch (error) {}
  }
  return language;
}
const systemLanguage = getSystemLanguage();

function getFilteredEnvironment() {
  const env = _.omit(process.env, 'ATOM_HOME', 'ELECTRON_RUN_AS_NODE', 'GOOGLE_API_KEY', 'NODE_ENV', 'NODE_PATH', 'userAgent', 'taskPath');
  if (!env.LANG) { env.LANG = systemLanguage; }
  env.TERM_PROGRAM = 'terminus';
  return env;
}
const filteredEnvironment = getFilteredEnvironment()

module.exports = function(pwd, shell, args, env, options = {}) {
  let ptyProcess;
  const callback = this.async();

  if (shell) {
    ptyProcess = pty.fork(shell, args, {
      cwd: pwd,
      env: _.extend(filteredEnvironment, env),
      name: 'xterm-256color'
    });
  } else {
    ptyProcess = pty.open();
  }

  const emitTitle = _.throttle(() => emit('terminus:title', ptyProcess.process), 500, true);

  ptyProcess.on('data', function(data) {
    emit('terminus:data', data);
    emitTitle();
  });

  ptyProcess.on('exit', function() {
    emit('terminus:exit');
    callback();
  });

  return process.on('message', function({event, cols, rows, text}={}) {
    switch (event) {
      case 'resize': {
        ptyProcess.resize(cols, rows);
        break;
      }
      case 'input': {
        ptyProcess.write(text);
        break;
      }
      case 'pty': {
        emit('terminus:pty', ptyProcess.pty);
        break;
      }
    }
  });
};
