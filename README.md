
                       ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗██╗   ██╗███████╗
                       ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██║   ██║██╔════╝
                          ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║██║   ██║███████╗
                          ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║   ██║╚════██║
                          ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║╚██████╔╝███████║
                          ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
<br>
<p align="center">
  <a href="https://github.com/bus-stop/terminus/tags">
    <img src="https://img.shields.io/github/tag/bus-stop/terminus.svg?label=current%20version&style=flat-square" alt="version">
  </a>
  <a href="https://github.com/bus-stop/terminus/stargazers">
    <img src="https://img.shields.io/github/stars/bus-stop/terminus.svg?style=flat-square" alt="stars">
  </a>
  <a href="https://github.com/bus-stop/terminus/network">
    <img src="https://img.shields.io/github/forks/bus-stop/terminus.svg?style=flat-square" alt="forks">
  </a>
  <a href="https://github.com/standard/standard">
    <img src="https://img.shields.io/badge/code_style-standard%20javascript-%23ea682c?&style=flat-square" alt="style guide">
  </a>
  <a href="https://david-dm.org/bus-stop/terminus">
    <img src="https://img.shields.io/david/dev/bus-stop/term.js.svg?label=dependencies&style=flat-square" alt="dependencies">
  </a>
  <a href="https://david-dm.org/bus-stop/terminus?type=dev">
    <img src="https://img.shields.io/david/dev/bus-stop/term.js.svg?label=devdependencies&style=flat-square" alt="dependencies">
  </a>
</p>
<h3 align="center">A terminal for Atom, with themes, API and more... Now coded in JavaScript!&nbsp;❤️</h3>
<h5 align="center">A fork of <a href="https://github.com/platformio/platformio-atom-ide-terminal">platformio/platformio-atom-ide-terminal<a/>
</h5>
<br>

![demo](https://github.com/bus-stop/terminus/raw/master/resources/t-demo.gif)

*[Atom One dark UI theme](https://atom.io/themes/one-dark-ui) with [Atom One Dark Syntax theme](https://atom.io/themes/atom-one-dark-syntax) and the included [One Dark theme.](https://github.com/bus-stop/terminus/blob/master/styles/themes/one-dark.less)*

# Contributing

Terminus is a 100% community driven project, there are no dedicated developers or support, there are a number of ways you can contribute to Terminus. Checkout our [CONTRIBUTING.MD](https://github.com/bus-stop/terminus/blob/master/CONTRIBUTING.md)

We are looking for and need contributors that can also develop, in order to survive as a project, please check out our code and help out where you can...

Thank you for your consideration.

## Install
Ready to install?

You can install via apm: `apm install terminus`

Or navigate to the install tab in Atom’s settings view, and search for Terminus.

## Usage

Terminus stays in the bottom of your editor while you work.

Click on a status icon to toggle that terminal (or <kbd>ctrl</kbd>-<kbd>\`</kbd>). Right click the status icon for a list of available commands. From the right-click menu you can color code the status icon as well as hide or close the terminal instance.

### Terminal

You can open the last active terminal with the `terminus:toggle` command (Default: <kbd>ctrl</kbd>-<kbd>\`</kbd>).  If no terminal instances are available, then a new one will be created. The same toggle command is used to hide the currently active terminal.

From there you can begin typing into the terminal. By default the terminal will change directory into the project folder if possible. The default working directory can be changed in the settings to the home directory or to the active file directory.

[See available commands below](#commands).

## Features
### Full Terminal

Every terminal is loaded with your system’s default initialization files. This ensures that you have access to the same commands and aliases as you would in your standard terminal.

### Themes

The terminal is preloaded with several themes that you can choose from.  
Not satisfied? Use the following template in your Atom stylesheet and customize colors:
```css
.terminus .xterm {
  background-color: #0d0208;
  color: #00ff41;

  ::selection {
    background-color: #003b00;
    color: #003b00;
  }

  .terminal-cursor {
    background-color: #00ff41;
  }
}
```

### Process Titles

By hovering over the terminal status icon, you can see which command process is currently running in the terminal.

![](https://github.com/bus-stop/terminus/raw/master/resources/t_title.png)

### Terminal Naming

Need a faster way to figure out which terminal is which? Name your status icons!

![](https://github.com/bus-stop/terminus/raw/master/resources/t-status-icon_rename.gif)

Available via the status icon context menu.

![](https://github.com/bus-stop/terminus/raw/master/resources/t-status-icon_rename-dialog.png)

### Color Coding

Color code your status icons!

![](https://github.com/bus-stop/terminus/raw/master/resources/t-status-icon_color_coding.png)

The colors are customizable in the settings, however the color names remain the same in the context menu.

### Sorting

Organize your open terminal instances by dragging and dropping them.

![](https://github.com/bus-stop/terminus/raw/master/resources/t-sorting.gif)

### Resizable

You can resize the view vertically, or just maximize it with the maximize button.

### Working Directory

You can set the default working directory for new terminals. By default this will be the project folder.

### File Dropping

Dropping a file on the terminal will insert the file path into the input. This works with external files, tabs from the Atom tab-view, and entries from the Atom tree-view.

### Insert Selected Text

Insert and run selected text from your text editor by running the `terminus:insert-selected-text` command or <kbd>ctrl</kbd>-<kbd>i</kbd>.

![](https://github.com/bus-stop/terminus/raw/master/resources/t-insert_selected_text.gif)

If you have text selected, it will insert your selected text into the active terminal and run it.  
If you don't have text selected it, will run the text on the line where your cursor is then proceed to the next line.

### Quick Command Insert

Quickly insert a command to your active terminal by executing the `terminus:insert-text` command.

![](https://github.com/bus-stop/terminus/raw/master/resources/t-insert_text.png)

A dialog will pop up asking for the input to insert. If you have the `Run Inserted Text` option enabled in the settings (default is false), Terminus will automatically run the command for you.

#### Support for Special Keys

Support for IME, dead keys and other key combinations via the `Insert Text` dialog box. Just click the keyboard button in the top left of the terminal or set up a keymap to the `terminus:insert-text` command.

![](https://github.com/bus-stop/terminus//raw/master/resources/t-special_keys.gif)

>**Note:** Make sure you have the `Run Inserted Command` toggle off otherwise it will run your inserted text.

### Map Terminal To

Map your terminals to each file or folder you are working on for automatic terminal switching.

#### File

![](https://github.com/bus-stop/terminus//raw/master/resources/t-map_terminals_to_file.gif)

#### Folder

![](https://github.com/bus-stop/terminus//raw/master/resources/t-map_terminals_to_folder.gif)

Toggling the `Auto Open a New Terminal (For Terminal Mapping)` option will have the mapping create a new terminal automatically for files and folders that don't have a terminal.  
The toggle is located right under the `Map Terminals To` option.

![](https://github.com/bus-stop/terminus/raw/master/resources/t-map_terminals_to_auto_open.gif)

## Commands

| Command | Action | Default Keybind |
|---------|--------|:-----------------:|
| terminus:new | Create a new terminal instance. | <kbd>ctrl</kbd>-<kbd>shift</kbd>-</kbd><kbd>t</kbd><br>or<br><kbd>cmd</kbd>-<kbd>shift</kbd>-<kbd>t</kbd> |
| terminus:toggle | Toggle the last active terminal instance.<br>**Note:** This will create a new terminal if it needs to. | <kbd>ctrl</kbd>-<kbd>\`</kbd><br>Control + Backtick |
| terminus:prev | Switch to the terminal left of the last active terminal. | <kbd>ctrl</kbd>-<kbd>shift</kbd>-<kbd>j</kbd><br>or<br><kbd>cmd</kbd>-<kbd>shift</kbd>-<kbd>j</kbd> |
| terminus:next | Switch to the terminal right of the last active terminal. | <kbd>ctrl</kbd>-<kbd>shift</kbd>-<kbd>k</kbd><br>or<br><kbd>cmd</kbd>-<kbd>shift</kbd>-<kbd>k</kbd> |
| terminus:insert-selected-text | Run the selected text as a command in the active terminal. | <kbd>ctrl</kbd>-<kbd>i</kbd> |
| terminus:insert-text | Bring up an input box for using IME and special keys. | <kbd>alt</kbd>-<kbd>shift</kbd>-<kbd>i</kbd><br>or<br><kbd>cmd</kbd>-<kbd>shift</kbd>-<kbd>i</kbd> |
| terminus:fullscreen | Toggle fullscreen for active terminal. | –––––––––––– |
| terminus:close | Close the active terminal. | <kbd>alt</kbd>-<kbd>shift</kbd>-<kbd>x</kbd><br>or<br><kbd>cmd</kbd>-<kbd>shift</kbd>-<kbd>x</kbd> |
| terminus:close-all | Close all terminals. | –––––––––––– |
| terminus:rename | Rename the active terminal. | –––––––––––– |

## Services

The `terminal` `v1.0.0` service is provided for other packages to interact with Terminus through Atom's [services](http://flight-manual.atom.io/behind-atom/sections/interacting-with-other-packages-via-services/) API.

The `terminal` service provides the following methods:

### `updateProcessEnv(object)`

Update environment variables for any new terminals.

### `run(string[])`

Run commands in a new terminal.

### `open()`

Open a new terminal.

### `getTerminalViews()`

Get the current views for all open terminals.
