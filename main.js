const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, ipcMain, nativeImage } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store();
let tray = null;
let mainWindow = null;
let quickPasteWindow = null;
let clipboardHistory = [];
let snippets = [];
let isMonitoring = true;
let lastClipboard = '';

// 초기 데이터 로드
function loadData() {
  clipboardHistory = store.get('clipboardHistory', []);
  snippets = store.get('snippets', [
    { id: '1', title: '인사', content: '안녕하세요, 좋은 하루 보내세요!', emoji: '👋', createdAt: Date.now() },
    { id: '2', title: '감사', content: '도움 주셔서 감사합니다.', emoji: '🙏', createdAt: Date.now() },
    { id: '3', title: '이메일', content: '확인 후 회신 드리겠습니다.\\n감사합니다.', emoji: '📧', createdAt: Date.now() }
  ]);
  isMonitoring = store.get('isMonitoring', true);
}

function saveData() {
  store.set('clipboardHistory', clipboardHistory.slice(0, 100));
  store.set('snippets', snippets);
  store.set('isMonitoring', isMonitoring);
}

// 클립보드 모니터링
function startClipboardMonitoring() {
  setInterval(() => {
    if (!isMonitoring) return;

    const text = clipboard.readText();
    if (text && text !== lastClipboard && text.length > 0) {
      lastClipboard = text;
      addToHistory(text);
    }
  }, 500);
}

function addToHistory(text) {
  // 중복 제거
  clipboardHistory = clipboardHistory.filter(item => item.content !== text);

  clipboardHistory.unshift({
    id: Date.now().toString(),
    content: text,
    type: 'text',
    sourceApp: '',
    timestamp: Date.now()
  });

  clipboardHistory = clipboardHistory.slice(0, 100);
  saveData();

  // 메인 윈도우가 열려 있으면 업데이트
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('data-updated');
  }
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createQuickPasteWindow(tab = 'clipboard') {
  if (quickPasteWindow && !quickPasteWindow.isDestroyed()) {
    quickPasteWindow.close();
  }

  quickPasteWindow = new BrowserWindow({
    width: 450,
    height: 400,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  quickPasteWindow.loadFile('quickpaste.html');

  quickPasteWindow.once('ready-to-show', () => {
    quickPasteWindow.webContents.send('set-tab', tab);
    quickPasteWindow.show();
    quickPasteWindow.center();
    quickPasteWindow.focus();
  });

  // 포커스 잃으면 닫기
  quickPasteWindow.on('blur', () => {
    if (quickPasteWindow && !quickPasteWindow.isDestroyed()) {
      quickPasteWindow.close();
    }
  });

  quickPasteWindow.on('closed', () => {
    quickPasteWindow = null;
  });
}

function createTray() {
  // 트레이 아이콘 생성 (간단한 텍스트 아이콘)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Collector 열기', click: createMainWindow },
    { type: 'separator' },
    {
      label: '자동 수집',
      type: 'checkbox',
      checked: isMonitoring,
      click: (item) => {
        isMonitoring = item.checked;
        saveData();
      }
    },
    { type: 'separator' },
    { label: '빠른 붙여넣기 (Ctrl+Shift+V)', click: () => createQuickPasteWindow('clipboard') },
    { label: '빠른 스니펫 (Ctrl+Shift+B)', click: () => createQuickPasteWindow('snippets') },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() }
  ]);

  tray.setToolTip('Collector');
  tray.setContextMenu(contextMenu);
  tray.on('click', createMainWindow);
}

function registerShortcuts() {
  // Ctrl+Shift+C - 수동 수집
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    const text = clipboard.readText();
    if (text) {
      lastClipboard = text;
      addToHistory(text);
    }
  });

  // Ctrl+Shift+V - 빠른 붙여넣기 (클립보드)
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    createQuickPasteWindow('clipboard');
  });

  // Ctrl+Shift+B - 빠른 스니펫
  globalShortcut.register('CommandOrControl+Shift+B', () => {
    createQuickPasteWindow('snippets');
  });
}

// IPC 핸들러
ipcMain.handle('get-clipboard-history', () => clipboardHistory);
ipcMain.handle('get-snippets', () => snippets);

ipcMain.handle('add-snippet', (event, snippet) => {
  snippets.unshift({
    id: Date.now().toString(),
    ...snippet,
    createdAt: Date.now()
  });
  saveData();
  return snippets;
});

ipcMain.handle('delete-snippet', (event, id) => {
  snippets = snippets.filter(s => s.id !== id);
  saveData();
  return snippets;
});

ipcMain.handle('clear-history', () => {
  clipboardHistory = [];
  saveData();
  return true;
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(text);
  lastClipboard = text;
  return true;
});

ipcMain.handle('paste-and-close', (event, text) => {
  clipboard.writeText(text);
  lastClipboard = text;

  if (quickPasteWindow && !quickPasteWindow.isDestroyed()) {
    quickPasteWindow.close();
  }

  // 클립보드에 복사됨 - 이후 수동으로 Ctrl+V
  // (자동 붙여넣기는 추가 네이티브 모듈 필요)

  return true;
});

// 앱 시작
app.whenReady().then(() => {
  loadData();
  createTray();
  registerShortcuts();
  startClipboardMonitoring();
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // 윈도우 모두 닫혀도 앱 종료하지 않음
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
