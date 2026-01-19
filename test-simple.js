const { app, BrowserWindow } = require('electron');

console.log('1. Requiring electron...');
console.log('2. App:', typeof app);

if (typeof app === 'undefined') {
  console.error('ERROR: app is undefined!');
  console.error('This means electron is not running properly');
  process.exit(1);
}

app.whenReady().then(() => {
  console.log('SUCCESS: Electron is working!');
  const win = new BrowserWindow({ width: 400, height: 300 });
  win.loadURL('data:text/html,<h1>Electron Works!</h1>');
  
  setTimeout(() => {
    app.quit();
  }, 2000);
});
