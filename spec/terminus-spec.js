describe('Terminus', () => {
  let workspaceElement, terminusPackage, activationPromise

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace)
    atom.packages.activatePackage('status-bar')
    terminusPackage = atom.packages.loadPackage('terminus')
    activationPromise = atom.packages.activatePackage('terminus')
  })

  describe('when the terminus:toggle event is triggered', () => {
    it('creates status-bar element on activate', async () => {
      expect(workspaceElement.querySelector('.terminus.status-bar')).not.toExist()

      terminusPackage.activateNow()
      await activationPromise

      expect(workspaceElement.querySelector('.terminus.status-bar')).toExist()
      expect(workspaceElement.querySelector('.terminus.terminal-view')).not.toExist()

      atom.commands.dispatch(workspaceElement, 'terminus:toggle')

      expect(workspaceElement.querySelector('.terminus.terminal-view')).toExist()
    })
  })
})
