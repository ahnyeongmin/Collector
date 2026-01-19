# Collector 📋

**Collector**는 Electron으로 제작된 강력하고 가벼운 클립보드 관리자 및 스니펫 도구입니다. 클립보드 이력을 추적하고 자주 사용하는 스니펫을 저장하여 업무 효율을 높여줍니다.

## ✨ 주요 기능

- **클립보드 모니터링**: 클립보드 이력을 자동으로 추적합니다 (최대 100개 저장).
- **스니펫 관리**: 자주 사용하는 텍스트를 스니펫으로 저장하고 관리할 수 있습니다.
- **빠른 붙여넣기 (Ctrl+Shift+V)**: 클립보드 이력을 즉시 확인하고 붙여넣을 수 있는 플로팅 UI를 제공합니다.
- **빠른 스니펫 (Ctrl+Shift+S)**: 저장된 스니펫에 빠르게 접근하고 사용할 수 있습니다.
- **다국어 지원**: 한국어와 영어권 개발자 모두를 위해 설계되었습니다.
- **멀티 플랫폼**: macOS, Windows, Linux를 모두 지원합니다.

## 🚀 시작하기

### 사전 준비

- [Node.js](https://nodejs.org/) (v18 이상 권장)
- npm (Node.js 설치 시 기본 포함)

### 설치 방법

1. 리포지토리 클론:
   ```bash
   git clone https://github.com/ahnyeongmin/Collector.git
   ```
2. 의존성 설치:
   ```bash
   npm install
   ```

### 개발 모드

DevTools가 자동으로 열리는 개발 모드로 실행하려면:
```bash
npm start
```

## 🛠️ 빌드 및 배포

이 프로젝트는 `electron-builder`를 사용하여 멀티 플랫폼 빌드를 지원합니다.

- **전체 플랫폼 빌드**: `npm run build-all`
- **Windows 빌드**: `npm run build`
- **macOS 빌드**: `npm run build-mac`
- **Linux 빌드**: `npm run build-linux`

### GitHub Actions (자동화)
버전 태그(예: `v1.0.5`)를 푸시하면 GitHub Actions가 자동으로 각 플랫폼별 설치 파일을 빌드하고 릴리스를 생성합니다.

## 💾 데이터 저장 위치

데이터는 `electron-store`를 통해 사용자의 로컬 환경에 `config.json` 파일로 저장됩니다.
- **macOS**: `~/Library/Application Support/collector/config.json`
- **Windows**: `%APPDATA%/collector/config.json`
- **Linux**: `~/.config/collector/config.json`

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---
**생산성을 위해 ❤️으로 제작되었습니다.**
