/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pty = require('node-pty-prebuilt-multiarch');
const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const child = require('child_process');

const systemLanguage = (function() {
  let language = "en_US.UTF-8";
  if (process.platform === 'darwin') {
    try {
      const command = 'plutil -convert json -o - ~/Library/Preferences/.GlobalPreferences.plist';
      language = `${JSON.parse(child.execSync(command).toString()).AppleLocale}.UTF-8`;
    } catch (error) {}
  }
  return language;
})();

const filteredEnvironment = (function() {
  const env = _.omit(process.env, 'ATOM_HOME', 'ELECTRON_RUN_AS_NODE', 'GOOGLE_API_KEY', 'NODE_ENV', 'NODE_PATH', 'userAgent', 'taskPath');
  if (env.LANG == null) { env.LANG = systemLanguage; }
  env.TERM_PROGRAM = 'terminus';
  return env;
})();

module.exports = function(pwd, shell, args, env, options={}) {
  let ptyProcess;
  const callback = this.async();

  if (shell) {
    ptyProcess = pty.fork(shell, args, {
      cwd: pwd,
      env: _.extend(filteredEnvironment, env),
      name: 'xterm-256color'
    }
    );

    const title = (shell = path.basename(shell));
  } else {
    ptyProcess = pty.open();
  }

  const emitTitle = _.throttle(() => emit('terminus:title', ptyProcess.process)
  , 500, true);

  ptyProcess.on('data', function(data) {
    emit('terminus:data', data);
    return emitTitle();
  });

  ptyProcess.on('exit', function() {
    emit('terminus:exit');
    return callback();
  });

  return process.on('message', function({event, cols, rows, text}={}) {
    switch (event) {
      case 'resize': return ptyProcess.resize(cols, rows);
      case 'input': return ptyProcess.write(text);
      case 'pty': return emit('terminus:pty', ptyProcess.pty);
    }
  });
};
