let currentFilter = 'all';
let currentSearch = '';
let clipboardHistory = [];
let snippets = [];
let selectedEmoji = '📝';

const emojis = ['📝', '💬', '📧', '👋', '🙏', '✅', '⭐', '🔗', '📋', '💡', '🎯', '🚀'];

// 초기 로드
async function init() {
  clipboardHistory = await window.electronAPI.getClipboardHistory();
  snippets = await window.electronAPI.getSnippets();

  setupEventListeners();
  updateFilterCounts();
  renderContent();
  setupEmojiPicker();

  // 데이터 업데이트 리스너
  window.electronAPI.onDataUpdated(async () => {
    clipboardHistory = await window.electronAPI.getClipboardHistory();
    updateFilterCounts();
    renderContent();
  });
}

function setupEventListeners() {
  // 필터 버튼
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderContent();
    });
  });

  // 검색
  document.getElementById('search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderContent();
  });

  // 추가 버튼 (스니펫용 - 나중에 구현)
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

  // 모달 저장
  document.getElementById('save-btn').addEventListener('click', async () => {
    const title = document.getElementById('snippet-title').value.trim();
    const content = document.getElementById('snippet-content').value.trim();

    if (title && content) {
      await window.electronAPI.addSnippet({ title, content, emoji: selectedEmoji });
      snippets = await window.electronAPI.getSnippets();
      renderContent();
      document.getElementById('add-modal').classList.remove('show');
    }
  });

  // 전체 삭제
  document.getElementById('clear-btn').addEventListener('click', async () => {
    if (confirm('정말로 모든 항목을 삭제하시겠습니까?')) {
      await window.electronAPI.clearHistory();
      clipboardHistory = [];
      updateFilterCounts();
      renderContent();
    }
  });

  // 설정 버튼 (추후 구현)
  document.getElementById('settings-btn').addEventListener('click', () => {
    alert('설정 기능은 추후 추가될 예정입니다.');
  });

  // 전원 버튼
  document.getElementById('power-btn').addEventListener('click', () => {
    if (confirm('Collector를 종료하시겠습니까?')) {
      window.close();
    }
  });
}

function updateFilterCounts() {
  const textCount = clipboardHistory.filter(item => item.type === 'text' || !item.type).length;
  const imageCount = clipboardHistory.filter(item => item.type === 'image').length;
  const fileCount = clipboardHistory.filter(item => item.type === 'file').length;
  const totalCount = clipboardHistory.length;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    const filter = btn.dataset.filter;
    const countEl = btn.querySelector('.filter-count');
    if (countEl) {
      switch (filter) {
        case 'all':
          countEl.textContent = totalCount;
          break;
        case 'text':
          countEl.textContent = textCount;
          break;
        case 'image':
          countEl.textContent = imageCount;
          break;
        case 'file':
          countEl.textContent = fileCount;
          break;
      }
    }
  });
}

function isTextItem(item) {
  // 텍스트 아이템인지 확인 (추후 이미지/파일 구분 로직 추가)
  return true;
}

function filterItems(items) {
  let filtered = items;

  // 필터 적용
  if (currentFilter !== 'all') {
    filtered = filtered.filter(item => {
      switch (currentFilter) {
        case 'text':
          return item.type === 'text' || !item.type;
        case 'image':
          return item.type === 'image';
        case 'file':
          return item.type === 'file';
        default:
          return true;
      }
    });
  }

  // 검색 적용
  if (currentSearch) {
    filtered = filtered.filter(item => {
      const searchContent = item.type === 'file' ? (item.meta?.fileName || item.content) : item.content;
      return searchContent.toLowerCase().includes(currentSearch);
    });
  }

  return filtered;
}

function renderContent() {
  const content = document.getElementById('content');
  const filtered = filterItems(clipboardHistory);

  if (filtered.length === 0) {
    content.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        <div class="empty-text">항목이 없습니다</div>
        <div class="empty-subtext">${currentSearch ? '검색 결과가 없습니다' : '클립보드 수집을 시작하세요'}</div>
      </div>
    `;
    return;
  }

  // 날짜별 그룹핑
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groupedItems = {
    today: [],
    yesterday: [],
    older: []
  };

  filtered.forEach(item => {
    const itemDate = new Date(item.timestamp).toDateString();
    if (itemDate === today) {
      groupedItems.today.push(item);
    } else if (itemDate === yesterday) {
      groupedItems.yesterday.push(item);
    } else {
      groupedItems.older.push(item);
    }
  });

  let html = '';

  // 오늘
  if (groupedItems.today.length > 0) {
    html += '<div class="section-header">오늘</div>';
    html += groupedItems.today.map(item => renderItem(item)).join('');
  }

  // 어제
  if (groupedItems.yesterday.length > 0) {
    html += '<div class="section-header">어제</div>';
    html += groupedItems.yesterday.map(item => renderItem(item)).join('');
  }

  // 이전
  if (groupedItems.older.length > 0) {
    html += '<div class="section-header">이전</div>';
    html += groupedItems.older.map(item => renderItem(item)).join('');
  }

  content.innerHTML = html;

  // 이벤트 델리게이션으로 아이템 클릭 처리
  content.querySelectorAll('.item').forEach(itemEl => {
    const itemId = itemEl.dataset.itemId;
    const item = clipboardHistory.find(i => i.id === itemId);

    itemEl.addEventListener('click', (e) => {
      if (!e.target.closest('.item-actions')) {
        copyToClipboard(item.content);
      }
    });

    const deleteBtn = itemEl.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteItem(itemId);
      });
    }
  });
}

function renderItem(item) {
  const isImage = item.type === 'image';
  const isFile = item.type === 'file';

  let thumbnail = '📄';
  let title = detectTitle(item.content);
  let preview = item.content.substring(0, 100);

  if (isImage) {
    thumbnail = `<img src="${item.content}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
    title = '이미지';
    preview = `${item.meta?.width}x${item.meta?.height} px`;
  } else if (isFile) {
    thumbnail = '📁';
    title = item.meta?.fileName || '파일';
    preview = item.content;
  }

  const timestamp = formatTimestamp(item.timestamp);
  const source = detectSource(item.content, item.type);

  return `
    <div class="item" data-item-id="${item.id}">
      <div class="item-thumbnail">${thumbnail}</div>
      <div class="item-content">
        <div class="item-title">${title}</div>
        <div class="item-text">${isImage ? preview : escapeHtml(preview)}</div>
        <div class="item-meta">
          <span>${source}</span>
          <div class="item-meta-dot"></div>
          <span>${timestamp}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-small btn-secondary" data-action="delete">삭제</button>
      </div>
    </div>
  `;
}

function detectTitle(content) {
  // 첫 줄을 제목으로 사용
  const firstLine = content.split('\n')[0].substring(0, 60);
  return firstLine || '텍스트';
}

function detectSource(content, type) {
  if (type === 'image') return '이미지 • Collector';
  if (type === 'file') return '파일 • Collector';
  if (content.includes('http://') || content.includes('https://')) {
    return '텍스트 • Google Chrome';
  }
  return '텍스트 • Collector';
}

function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

async function copyToClipboard(content, type = 'text') {
  await window.electronAPI.copyToClipboard(content, type);
  // 포커스 이동을 위해 윈도우 숨김 요청 (선택사항, main에서 처리하도록 push-and-close 사용 권장)
}

async function deleteItem(id) {
  // 배열에서 직접 제거
  clipboardHistory = clipboardHistory.filter(item => item.id !== id);
  updateFilterCounts();
  renderContent();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setupEmojiPicker() {
  const picker = document.getElementById('emoji-picker');
  picker.innerHTML = emojis.map(emoji =>
    `<span class="emoji" onclick="selectEmoji('${emoji}')">${emoji}</span>`
  ).join('');
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  document.querySelectorAll('.emoji').forEach(e => e.classList.remove('selected'));
  event.target.classList.add('selected');
}

// 초기화
init();
