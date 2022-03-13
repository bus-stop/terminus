const isString = x => typeof x === 'string'

// visibility for items in bottom dock
module.exports.isVisible = function (itemOrUri) {
  const uri = isString(itemOrUri) ? itemOrUri : itemOrUri.getURI()

  const dock = atom.workspace.getBottomDock()
  if (!dock.isVisible()) return false

  const activeItem = dock.getActivePaneItem()
  if (!activeItem) return false

  return activeItem.getURI && activeItem.getURI() === uri
}

module.exports.isUseDockEnabled = () => atom.config.get('terminus.toggles.useDock')
