# 디버깅 로그: 윈도우 레이스 컨디션 및 TypeError

## 1. 문제 설명
- **오류**: `main.js`에서 발생한 `TypeError: Cannot read properties of null (reading 'show')`.
- **증상**: 사용자가 `Ctrl+Shift+V`를 빠르게 연타하거나 항목을 선택할 때 간헐적으로 발생.
- **원인**: 일렉트론(Electron)의 비동기 창 관리 과정에서 발생하는 레이스 컨디션(Race Condition).

## 2. 원인 분석
### 문제가 된 코드 패턴
```javascript
let quickPasteWindow = null;

function createQuickPasteWindow() {
  if (quickPasteWindow) quickPasteWindow.close();
  quickPasteWindow = new BrowserWindow(...);
  
  quickPasteWindow.once('ready-to-show', () => {
    quickPasteWindow.show(); // 여기서 레이스 컨디션 발생!
  });

  quickPasteWindow.on('closed', () => {
    quickPasteWindow = null; // 이 코드가 새로운 창 인스턴스의 참조를 지울 수 있음!
  });
}
```

### 상세 발생 과정 (Trace)
1.  사용자가 `createQuickPasteWindow` 실행 (인스턴스 A 생성).
2.  사용자가 즉시 다시 실행 (인스턴스 B 생성 시작).
3.  `Instance A.close()` 호출됨.
4.  `Instance B`가 생성되어 전역 변수 `quickPasteWindow`에 할당됨.
5.  `Instance A`가 완전히 닫히며 `closed` 이벤트 발생.
6.  `Instance A`의 `closed` 핸들러가 실행되어 전역 변수 `quickPasteWindow`를 `null`로 설정.
7.  `Instance B`가 `ready-to-show` 이벤트 발생.
8.  핸들러가 `quickPasteWindow.show()`를 호출하려 하지만, `quickPasteWindow`는 이미 `null`임. **크래시 발생.**

## 3. 해결 방안: 견고한 인스턴스 추적
### 수정된 코드 패턴
```javascript
let quickPasteWindow = null;

function createQuickPasteWindow() {
  if (quickPasteWindow && !quickPasteWindow.isDestroyed()) {
    quickPasteWindow.close();
  }

  // 지역 변수를 사용하여 특정 인스턴스를 캡처(Closure)
  const win = new BrowserWindow(...);
  quickPasteWindow = win;

  win.once('ready-to-show', () => {
    // 캡처된 인스턴스가 여전히 유효한지 확인
    if (!win.isDestroyed()) {
      win.show();
    }
  });

  win.on('closed', () => {
    // 전역 변수가 여전히 '이 특정 인스턴스'를 가리키고 있을 때만 null로 설정
    if (quickPasteWindow === win) {
      quickPasteWindow = null;
    }
  });
}
```

## 4. 핵심 교훈
- **비동기 창 이벤트에서 전역 상태 주의**: 항상 지역 변수를 사용하여 클로저 내에서 특정 인스턴스를 캡처해야 합니다.
- **인스턴스 유효성 검사**: `setTimeout`이나 `once('ready-to-show')`와 같이 지연된 콜백에서는 호출 전 `isDestroyed()`를 체크하는 것이 안전합니다.
- **선택적 초기화**: `closed` 이벤트 핸들러가 동일한 전역 변수를 사용하는 최신 인스턴스에 영향을 주지 않도록 인스턴스 비교 로직을 넣어야 합니다.
