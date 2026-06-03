# 저는 결제하라고 나오면 닫아버립니다

AI 구독 결제창을 피해 5개월을 버티는 1인칭 CCTV 생존 공포 게임입니다. 이제 전력 대신 토큰을 관리하며, 점수는 실시간으로 오르지 않고 월말 정산 또는 게임 오버 인보이스에서만 계산됩니다.

## 플레이

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다.

로컬 더블클릭용 단일 파일과 배포 산출물을 만들려면:

```bash
npm run build
```

`index.html`을 파일로 열면 자동으로 `PLAY.html`로 이동합니다.

## 배포

Netlify는 `netlify.toml`을 사용합니다.

- Build command: `npm run build`
- Publish directory: `dist`

## 조작

- `C`: CCTV 열기/닫기
- `Esc`: CCTV 닫기
- `Q` / `E`: 왼쪽 문 / 오른쪽 문
- `A` / `D`: 사무실에서는 왼쪽/오른쪽 라이트, CCTV에서는 카메라 전환
- CCTV 화면의 지도 박스 클릭: 해당 카메라로 이동
- `M`: 음소거
- `R`: 모션 줄이기
- 마우스: 화면 버튼 클릭

## 규칙

- `1개월차`부터 `5개월차`까지 각 90초를 버팁니다.
- HUD는 현재 월, 월 진행 단계, `남은 토큰 98.7%` 형식의 토큰만 보여줍니다.
- CCTV, 닫힌 문, 켜진 라이트는 토큰을 추가로 소모합니다.
- 토큰이 0%가 되면 CCTV, 문, 라이트가 실패하고 잠시 뒤 구독 블랙아웃 점프스케어가 발생할 수 있습니다.
- Gemini, Grok, ChatGPT는 현재 방을 CCTV로 보고 있으면 움직이지 않습니다.
- Claude는 커튼방에서 단계적으로 나온 뒤 왼쪽 복도를 질주합니다. 질주 중에는 CCTV로 봐도 멈추지 않으므로 왼쪽 문 타이밍이 중요합니다.
- CCTV 지도에는 적 위치 점이나 표식이 없습니다. 실제 카메라 화면과 라이트로만 확인해야 합니다.
- 라이트는 문 앞의 적을 확인하는 용도이며, Claude 질주는 라이트로 확인되지 않습니다.

## 점수

월말 클리어 시 남은 토큰을 한 자리 소수로 저장합니다.

```text
monthTokenScore = round(tokens * 10) / 10
```

게임 오버 시:

```text
partialFailedMonthScore = round(tokens * survivedRatio * 10) / 10
finalScore = round((sum(clearedMonthTokenScores) + partialFailedMonthScore) * 10) / 10
```

5개월 완주 시:

```text
finalScore = round(sum(stageTokenResults) * 10) / 10
```

게임 오버 화면은 패배시킨 인형의 구독 인보이스를 보여줍니다.

- Grok Doll: `Grok Heavy $300`
- ChatGPT Doll: `ChatGPT Pro $200`
- Claude Doll: `Claude Max $200`
- Gemini Doll: `Google AI Ultra $249.99`

## 자산 정책

- 모든 시각 자산은 `assets/generated/`의 로컬 PNG입니다.
- 현재 핵심 배경/스프라이트/점프스케어는 Codex 이미지 생성으로 만들고, 투명 스프라이트는 로컬 크로마키 후처리로 고정 캔버스에 맞췄습니다.
- FNAF1 자료는 카메라 구도와 CCTV 문법 참고용으로만 사용했고, 게임에 복사된 외부 이미지나 FNAF 원본 에셋은 없습니다.
- SVG, 외부 이미지, 외부 오디오, 외부 폰트, CDN, 복사된 공식 로고, 실사 사진을 사용하지 않습니다.
- 오디오는 WebAudio로 절차 생성합니다.

## 테스트

```bash
npm test
npm run build
```

검증 항목:

- 1개월차가 쉬우면서도 매번 같은 루트로 고정되지 않음
- 보고 있는 CCTV 방의 Gemini/Grok/ChatGPT는 이동하지 않음
- Claude는 질주 중 CCTV로 봐도 계속 진행함
- 라이트가 문 앞 적을 드러내고 토큰을 소모함
- CCTV 지도에 적 위치 점이 없음
- active HUD에 실시간 점수가 없음
- 게임 오버 인보이스와 `쌀먹의 신` 최종 클리어 화면이 표시됨
