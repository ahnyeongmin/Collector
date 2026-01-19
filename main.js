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

    const formats = clipboard.availableFormats();

    // 1. 이미지 처리
    if (formats.includes('image/png') || formats.includes('image/jpeg')) {
      const image = clipboard.readImage();
      const dataUrl = image.toDataURL();
      if (dataUrl && dataUrl !== lastClipboard && dataUrl.length > 22) { // 22 is empty data url length approx
        lastClipboard = dataUrl;
        addThumbnailToHistory(image, dataUrl);
        return;
      }
    }

    // 2. 파일 처리 (macOS: 'text/uri-list', Windows: 'FileNameW')
    const filePath = clipboard.read('text/uri-list') || clipboard.read('FileNameW');
    if (filePath && filePath !== lastClipboard) {
      lastClipboard = filePath;
      addFileToHistory(filePath);
      return;
    }

    // 3. 텍스트 처리
    const text = clipboard.readText();
    if (text && text !== lastClipboard && text.length > 0) {
      lastClipboard = text;
      addToHistory(text);
    }
  }, 1000); // 1초 주기로 변경 (성능 고려)
}

function addThumbnailToHistory(image, dataUrl) {
  const size = image.getSize();
  clipboardHistory.unshift({
    id: Date.now().toString(),
    content: dataUrl,
    type: 'image',
    meta: { width: size.width, height: size.height },
    timestamp: Date.now()
  });
  finalizeHistoryUpdate();
}

function addFileToHistory(rawPath) {
  // macOS의 경우 file:/// 경로로 오므로 정규화 필요
  let filePath = rawPath.trim().split('\n')[0]; // 여러 파일인 경우 첫 번째만
  if (filePath.startsWith('file://')) {
    filePath = decodeURI(filePath.replace('file://', ''));
  }

  clipboardHistory.unshift({
    id: Date.now().toString(),
    content: filePath,
    type: 'file',
    meta: { fileName: path.basename(filePath) },
    timestamp: Date.now()
  });
  finalizeHistoryUpdate();
}

function addToHistory(text) {
  // 중복 제거
  clipboardHistory = clipboardHistory.filter(item => item.content !== text);

  clipboardHistory.unshift({
    id: Date.now().toString(),
    content: text,
    type: 'text',
    timestamp: Date.now()
  });

  finalizeHistoryUpdate();
}

function finalizeHistoryUpdate() {
  clipboardHistory = clipboardHistory.slice(0, 100);
  saveData();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('data-updated');
  }
}

function createMainWindow() {
  console.log('[Main] createMainWindow called');

  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('[Main] Main window already exists, showing...');
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  console.log('[Main] Creating new main window...');
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
  console.log('[Main] createQuickPasteWindow called with tab:', tab);

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
    backgroundColor: '#667eea',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  quickPasteWindow.loadFile('quickpaste.html');

  // 디버깅을 위해 DevTools 열기 (개발 모드에서만)
  if (!app.isPackaged) {
    quickPasteWindow.webContents.openDevTools({ mode: 'detach' });
  }

  quickPasteWindow.once('ready-to-show', () => {
    quickPasteWindow.show();
    quickPasteWindow.center();
    quickPasteWindow.focus();

    // renderer 프로세스가 준비될 때까지 약간 대기
    setTimeout(() => {
      console.log('[Main] Sending set-tab message with:', tab);
      quickPasteWindow.webContents.send('set-tab', tab);
    }, 100);
  });

  // 포커스 잃으면 닫기 (일시적으로 비활성화)
  // quickPasteWindow.on('blur', () => {
  //   if (quickPasteWindow && !quickPasteWindow.isDestroyed()) {
  //     quickPasteWindow.close();
  //   }
  // });

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
    { label: '빠른 스니펫 (Ctrl+Shift+S)', click: () => createQuickPasteWindow('snippets') },
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

  // Ctrl+Shift+S - 빠른 스니펫
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    createQuickPasteWindow('snippets');
  });
}

// 앱 시작
app.whenReady().then(() => {
  loadData();

  // IPC 핸들러 등록
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

  ipcMain.handle('paste-and-close', async (event, text, type = 'text') => {
    console.log('[IPC] paste-and-close called with type:', type);

    try {
      if (type === 'image') {
        const nativeImg = nativeImage.createFromDataURL(text);
        clipboard.writeImage(nativeImg);
      } else {
        clipboard.writeText(text);
      }

      lastClipboard = text;

      // 윈도우 숨기기 및 포커스 반환
      if (quickPasteWindow && !quickPasteWindow.isDestroyed()) {
        quickPasteWindow.hide(); // close 대신 hide로 부드럽게
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }

      if (process.platform === 'darwin') {
        app.hide(); // macOS에서 이전 앱으로 포커스 반환
      }

      return { success: true };
    } catch (error) {
      console.error('[IPC] paste-and-close error:', error);
      return { success: false, error: error.message };
    }
  });

  // 창 닫기 핸들러
  ipcMain.on('close-window', (event) => {
    const webContents = event.sender;
    const window = BrowserWindow.fromWebContents(webContents);
    if (window) {
      window.close();
    }
  });

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
