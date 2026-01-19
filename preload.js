const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  getSnippets: () => ipcRenderer.invoke('get-snippets'),
  addSnippet: (snippet) => ipcRenderer.invoke('add-snippet', snippet),
  deleteSnippet: (id) => ipcRenderer.invoke('delete-snippet', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  pasteAndClose: (text) => ipcRenderer.invoke('paste-and-close', text),
  closeWindow: () => ipcRenderer.send('close-window'),
  onDataUpdated: (callback) => ipcRenderer.on('data-updated', callback),
  onSetTab: (callback) => ipcRenderer.on('set-tab', (event, tab) => callback(tab))
});
