let currentTab = 'clipboard';
let clipboardHistory = [];
let snippets = [];
let selectedEmoji = '📝';

const emojis = ['📝', '💬', '📧', '👋', '🙏', '✅', '⭐', '🔗', '📋', '💡', '🎯', '🚀'];

// 초기 로드
async function init() {
  clipboardHistory = await window.electronAPI.getClipboardHistory();
  snippets = await window.electronAPI.getSnippets();

  setupEventListeners();
  renderContent();
  setupEmojiPicker();

  // 데이터 업데이트 리스너
  window.electronAPI.onDataUpdated(async () => {
    clipboardHistory = await window.electronAPI.getClipboardHistory();
    if (currentTab === 'clipboard') {
      renderContent();
    }
  });
}

function setupEventListeners() {
  // 탭 전환
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 스니펫 탭일 때만 추가 버튼 보이기
      const addBtn = document.getElementById('add-btn');
      addBtn.style.display = currentTab === 'snippets' ? 'block' : 'none';

      renderContent();
    });
  });

  // 추가 버튼
  document.getElementById('add-btn').addEventListener('click', () => {
    document.getElementById('add-modal').classList.add('show');
    document.getElementById('snippet-title').value = '';
    document.getElementById('snippet-content').value = '';
    selectEmoji('📝');
  });

  // 모달 취소
  document.getElementById('cancel-btn').addEventListener('click', () => {
    document.getElementById('add-modal').classList.remove('show');
  });

  // 스니펫 저장
  document.getElementById('save-btn').addEventListener('click', async () => {
    const title = document.getElementById('snippet-title').value.trim();
    const content = document.getElementById('snippet-content').value.trim();

    if (title && content) {
      snippets = await window.electronAPI.addSnippet({
        title,
        content,
        emoji: selectedEmoji
      });

      document.getElementById('add-modal').classList.remove('show');
      renderContent();
    }
  });

  // 전체 삭제
  document.getElementById('clear-btn').addEventListener('click', async () => {
    if (confirm('모든 항목을 삭제하시겠습니까?')) {
      if (currentTab === 'clipboard') {
        await window.electronAPI.clearHistory();
        clipboardHistory = [];
      }
      renderContent();
    }
  });
}

function setupEmojiPicker() {
  const picker = document.getElementById('emoji-picker');
  picker.innerHTML = emojis.map(emoji =>
    `<span class="emoji ${emoji === selectedEmoji ? 'selected' : ''}" data-emoji="${emoji}">${emoji}</span>`
  ).join('');

  picker.querySelectorAll('.emoji').forEach(el => {
    el.addEventListener('click', () => {
      selectEmoji(el.dataset.emoji);
    });
  });
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  document.querySelectorAll('.emoji').forEach(el => {
    el.classList.toggle('selected', el.dataset.emoji === emoji);
  });
}

function renderContent() {
  const content = document.getElementById('content');

  if (currentTab === 'clipboard') {
    if (clipboardHistory.length === 0) {
      content.innerHTML = '<div class="empty">수집된 항목이 없습니다</div>';
      return;
    }

    content.innerHTML = clipboardHistory.map(item => `
      <div class="item" data-id="${item.id}">
        <div class="item-icon">📄</div>
        <div class="item-content">
          <div class="item-text">${escapeHtml(item.content.substring(0, 100))}</div>
        </div>
        <div class="item-actions">
          <button class="btn" onclick="copyItem('${item.id}')">복사</button>
        </div>
      </div>
    `).join('');
  } else {
    if (snippets.length === 0) {
      content.innerHTML = '<div class="empty">스니펫이 없습니다<br><br>+ 버튼을 눌러 추가하세요</div>';
      return;
    }

    content.innerHTML = snippets.map(snippet => `
      <div class="item" data-id="${snippet.id}">
        <div class="item-icon">${snippet.emoji}</div>
        <div class="item-content">
          <div class="item-title">${escapeHtml(snippet.title)}</div>
          <div class="item-text">${escapeHtml(snippet.content.substring(0, 50))}</div>
        </div>
        <div class="item-actions">
          <button class="btn" onclick="copySnippet('${snippet.id}')">복사</button>
          <button class="btn btn-danger" onclick="deleteSnippet('${snippet.id}')">삭제</button>
        </div>
      </div>
    `).join('');
  }
}

async function copyItem(id) {
  const item = clipboardHistory.find(i => i.id === id);
  if (item) {
    await window.electronAPI.copyToClipboard(item.content);
  }
}

async function copySnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    await window.electronAPI.copyToClipboard(snippet.content);
  }
}

async function deleteSnippet(id) {
  if (confirm('이 스니펫을 삭제하시겠습니까?')) {
    snippets = await window.electronAPI.deleteSnippet(id);
    renderContent();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
