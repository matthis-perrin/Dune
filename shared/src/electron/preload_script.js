const {ipcRenderer} = require('electron');

function messageFromMainHandler(channel, data) {
  window.postMessage({sender: 'preload', data}, '*');
}

function messageFromWebHandler(event) {
  if (event.source !== window || typeof event.data !== 'object' || event.data.sender !== 'web') {
    return;
  }
  ipcRenderer.send('bridge-message', event.data.data);
}

ipcRenderer.on('bridge-message', messageFromMainHandler);
window.addEventListener('message', messageFromWebHandler, false);
