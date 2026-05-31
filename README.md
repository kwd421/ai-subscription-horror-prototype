# 저는 결제하라고 나오면 닫아버립니다

AI 구독 결제창이 사무실까지 찾아오는 1인칭 CCTV 생존 공포 게임 프로토타입입니다. 5일차까지 매일 12 AM부터 6 AM까지 버티면 클리어됩니다.

## 플레이

배포된 사이트에서는 첫 화면에서 바로 플레이할 수 있습니다.

로컬에서 더블클릭으로 실행하려면 먼저 단일 파일 버전을 만듭니다.

```bash
npm run build
```

그 뒤 `index.html`을 열면 `PLAY.html`로 자동 이동합니다. `PLAY.html`은 코드와 PNG 자산이 모두 들어간 오프라인 실행용 단일 HTML입니다.

개발 서버로 실행하려면:

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다.

## 배포

Netlify는 `netlify.toml` 설정을 사용합니다.

```bash
npm run build
```

빌드 결과는 `dist/`에 생성되며, Netlify의 publish directory도 `dist`입니다.

## 테스트

```bash
npm test
```

## 조작

- `C` 또는 사무실 CCTV 모니터 클릭: CCTV 열기/닫기
- `A` / `D` 또는 방향키: CCTV 카메라 전환
- `Q`: 왼쪽 문 열기/닫기
- `E`: 오른쪽 문 열기/닫기
- `Esc`: CCTV 닫기
- `M`: 음소거
- `R`: 움직임 줄이기
- 마우스: 화면 버튼 클릭

## 자산 정책

- 모든 시각 자산은 로컬 PNG로 보관합니다.
- SVG, 외부 이미지, 외부 오디오, 외부 폰트, CDN을 사용하지 않습니다.
- 오디오는 WebAudio로 절차적으로 생성합니다.
