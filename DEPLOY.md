# 🚀 배포 가이드 - exe 자동 빌드

**팀원들이 Node.js 설치 없이 exe만 실행하도록 만들기**

---

## 📦 자동 빌드 (GitHub Actions)

### 1단계: GitHub에 올리기

```bash
# 1. GitHub에서 새 저장소 생성 (예: Collector)

# 2. 이 폴더를 git 저장소로 초기화
git init
git add .
git commit -m "Initial commit"

# 3. GitHub에 push
git remote add origin https://github.com/yourname/Collector.git
git branch -M main
git push -u origin main
```

### 2단계: Release 만들기

```bash
# 버전 태그 생성
git tag v1.0.0
git push origin v1.0.0
```

### 3단계: 자동 빌드 완료!

- GitHub에서 Actions 탭 확인
- 자동으로 Windows, macOS, Linux용 빌드 진행
- 완료되면 Releases 탭에 다운로드 가능한 파일 생성됨

---

## 📥 다운로드 (팀원용)

1. GitHub 저장소 → **Releases** 탭
2. 최신 버전 선택
3. **Assets** 섹션에서 다운로드:
   - **Windows**: `Collector-Setup-1.0.0.exe`
   - **macOS**: `Collector-1.0.0.dmg`
   - **Linux**: `Collector-1.0.0.AppImage`

4. **더블클릭으로 설치 및 실행**
   - 아무것도 설치 불필요!
   - Python 불필요!
   - Node.js 불필요!

---

## 🔄 업데이트 배포

새 버전 배포 시:

```bash
# 코드 수정 후
git add .
git commit -m "Update to v1.1.0"
git push

# 새 버전 태그
git tag v1.1.0
git push origin v1.1.0

# → 자동으로 새 빌드 생성됨
```

---

## 💡 수동 빌드 (GitHub 없이)

GitHub를 사용하지 않고 직접 빌드하려면:

### Windows에서:
```bash
npm install
npm run build
# 결과: dist/Collector-Setup-1.0.0.exe
```

### macOS에서:
```bash
npm install
npm run build-mac
# 결과: dist/Collector-1.0.0.dmg
```

### Linux에서:
```bash
npm install
npm run build
# 결과: dist/Collector-1.0.0.AppImage
```

**주의**: 한 번만 빌드하면 그 exe를 팀원 모두 사용 가능!

---

## 📊 빌드 파일 크기

- **Windows exe**: ~80-120MB
- **macOS dmg**: ~90-130MB
- **Linux AppImage**: ~90-120MB

(Electron + Chromium이 포함되어 있어 용량이 큼)

---

## ✅ 최종 팀원 배포 방법

**옵션 1: GitHub Releases (권장)**
1. GitHub에 올리기
2. 태그 생성 → 자동 빌드
3. Releases 링크만 공유
4. 팀원은 exe 다운로드 → 설치 → 실행

**옵션 2: 직접 빌드**
1. 한 명이 Windows에서 `npm run build` 실행
2. 생성된 exe를 공유 폴더나 클라우드에 업로드
3. 팀원은 다운로드 → 실행

**옵션 3: Google Drive/Dropbox**
1. exe 빌드
2. 클라우드에 업로드
3. 링크 공유

---

## 🎯 요약

```
GitHub에 Push → 태그 생성 → 자동 빌드 → exe 다운로드 → 실행!
     │
     └→ 팀원은 아무것도 설치 불필요
```

**한 번만 빌드하면 끝!**
