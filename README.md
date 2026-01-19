# Collector - Electron Edition

**크로스플랫폼 클립보드 관리 & 스니펫 도구**

Windows, macOS, Linux 모두 지원 | Python 설치 불필요 | 단일 실행 파일

---

## ✨ 기능

- **자동 클립보드 수집**: 복사할 때마다 자동 저장
- **수동 수집**: `Ctrl+Shift+C`로 즉시 수집
- **빠른 붙여넣기**: `Ctrl+Shift+V`로 최근 항목 선택
- **스니펫 관리**: `Ctrl+Shift+B`로 자주 쓰는 텍스트 빠르게 입력
- **시스템 트레이**: 백그라운드 실행
- **크로스플랫폼**: Windows, macOS, Linux

---

## 🚀 빠른 시작

### ⭐ 방법 1: GitHub에서 다운로드 (최고 편함!)

**아무것도 설치 불필요! exe만 다운로드하면 끝!**

1. **GitHub Releases 페이지 접속**
   - 저장소의 `Releases` 탭 클릭

2. **최신 버전 다운로드**
   - Windows: `Collector-Setup-1.0.0.exe` (80-120MB)
   - macOS: `Collector-1.0.0.dmg`
   - Linux: `Collector-1.0.0.AppImage`

3. **설치 및 실행**
   - **Windows**: exe 더블클릭 → 설치 → 완료!
   - **macOS**: dmg 열기 → Applications로 드래그
   - **Linux**: 실행 권한 부여 (`chmod +x`) → 실행

4. **완료!**
   - Python ❌
   - Node.js ❌
   - 추가 설치 ❌
   - 그냥 실행만 하면 됨! ✅

---

### 방법 2: GitHub Actions로 자동 빌드 (개발자용)

**한 번만 설정하면 자동으로 exe 빌드됨**

```bash
# 1. GitHub에 Push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/Collector.git
git push -u origin main

# 2. 버전 태그 생성
git tag v1.0.0
git push origin v1.0.0

# 3. 완료! GitHub Actions가 자동으로 빌드
# → Releases에 exe 파일 생성됨
```

자세한 내용: [DEPLOY.md](DEPLOY.md) 참고

---

### 방법 3: 직접 빌드 (고급 사용자)

Node.js 설치 후:

```bash
npm install
npm run build  # Windows exe 빌드
npm run build-all  # 모든 플랫폼 빌드
```

---

## 🎯 사용법

### 기본 사용

1. **자동 수집 모드**
   - 앱 실행 후 평소처럼 복사 (`Ctrl+C`)
   - 자동으로 히스토리에 저장됨

2. **빠른 붙여넣기**
   - `Ctrl+Shift+V` 누르기
   - 화살표나 숫자키로 선택
   - `Enter`로 클립보드에 복사
   - `Ctrl+V`로 붙여넣기

3. **스니펫 사용**
   - 트레이 아이콘 클릭 → 스니펫 탭
   - `+` 버튼으로 새 스니펫 추가
   - `Ctrl+Shift+B`로 빠른 접근

---

## ⌨️ 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl+Shift+C` | 현재 클립보드 수동 수집 |
| `Ctrl+Shift+V` | 빠른 붙여넣기 (클립보드) |
| `Ctrl+Shift+B` | 빠른 스니펫 |

### 빠른 붙여넣기 창

| 키 | 기능 |
|----|------|
| `↑` / `↓` | 항목 이동 |
| `Enter` | 선택 및 복사 |
| `1-9`, `0` | 바로 선택 |
| `Tab` | 클립보드 ↔ 스니펫 전환 |
| `Esc` | 닫기 |

---

## 📁 데이터 저장 위치

- **Windows**: `%APPDATA%\\Collector\\config.json`
- **macOS**: `~/Library/Application Support/Collector/config.json`
- **Linux**: `~/.config/Collector/config.json`

---

## 🛠️ 개발자 가이드

### 프로젝트 구조

```
Electron/
├── main.js          # 메인 프로세스 (시스템 트레이, 단축키)
├── preload.js       # IPC 브릿지 (보안)
├── index.html       # 메인 창 UI
├── renderer.js      # 메인 창 로직
├── quickpaste.html  # 빠른 붙여넣기 창
├── package.json     # 프로젝트 설정
└── README.md        # 이 파일
```

### 주요 의존성

- `electron`: 데스크톱 앱 프레임워크
- `electron-store`: 설정 및 데이터 저장
- `electron-builder`: 실행 파일 빌드

### 빌드 설정

`package.json`의 `build` 섹션에서 빌드 옵션 수정 가능:

- `appId`: 앱 식별자
- `productName`: 앱 이름
- `icon`: 아이콘 파일
- `target`: 빌드 대상 (nsis, dmg, AppImage 등)

---

## 🐛 문제 해결

### 앱이 시작되지 않음

- Node.js 버전 확인 (16 이상)
- `npm install` 재실행
- 개발 모드로 실행: `npm start`

### 단축키가 작동하지 않음

- 다른 앱과 단축키 충돌 확인
- 관리자 권한으로 실행 (Windows)

### 트레이 아이콘이 보이지 않음

- 시스템 트레이 설정 확인
- Windows: 시스템 트레이 숨겨진 아이콘 보기

---

## 🎨 커스터마이징

### 단축키 변경

`main.js` 파일의 `registerShortcuts()` 함수에서 수정:

```javascript
globalShortcut.register('CommandOrControl+Alt+V', () => {
  createQuickPasteWindow('clipboard');
});
```

### UI 스타일 변경

- `index.html`: 메인 창 스타일
- `quickpaste.html`: 빠른 붙여넣기 창 스타일

---

## 📝 라이선스

MIT License

---

## 🤝 기여

이슈 및 PR 환영합니다!

1. Fork
2. Feature 브랜치 생성
3. Commit
4. Push
5. Pull Request

---

## 💡 팁

- **시작 프로그램 등록**:
  - Windows: 설치 시 자동 옵션 선택
  - macOS: 시스템 환경설정 → 사용자 및 그룹 → 로그인 항목

- **빠른 사용**: 단축키를 익혀두면 생산성 UP!

- **스니펫 활용**: 자주 쓰는 이메일 템플릿, 코드 조각 등 저장

---

**즐거운 코딩 되세요! 🚀**
