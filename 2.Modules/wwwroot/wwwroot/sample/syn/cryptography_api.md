# syn.$c API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$c` (원본: `context.$cryptography`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 1272~2151번째 줄) |
| 예제 페이지 | `/sample/syn/cryptography.html` |
| 의존 모듈 | `syn.$string`(`$string.toBoolean`), `syn.$l`(`eventLog`, `stringToArrayBuffer`), 브라우저 WebCrypto(`crypto.subtle`) |

## 속성
`$cryptography`는 별도로 노출되는 데이터 속성이 없으며, 모든 기능은 메서드로 제공됩니다. (내부적으로 `LZString`이라는 하위 네임스페이스 객체를 property로 가지고 있으며, 이 객체가 제공하는 압축/해제 함수는 메서드 목록에서 다룹니다.)

## 메서드

### `syn.$c.isWebCryptoSupported()`
- 설명: 현재 실행 환경에서 `crypto.subtle`(WebCrypto)을 사용할 수 있는지 여부를 반환합니다.
- 매개변수: 없음
- 반환값: `boolean` — WebCrypto 지원 여부
- 예시
  ```js
  if (syn.$c.isWebCryptoSupported()) {
      syn.$c.generateRSAKey().then((cryptoKey) => { /* ... */ });
  }
  ```

### `syn.$c.base64Encode(val)`
- 설명: 문자열을 base64 문자열로 인코딩합니다. `devicePlatform === 'node'`인 경우 Node `Buffer`를 사용합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 인코딩할 원본 문자열 |
- 반환값: `string` — base64 인코딩 문자열 (실패 시 `null`)
- 예시
  ```js
  const encoded = syn.$c.base64Encode('hello world');
  ```

### `syn.$c.base64Decode(val)`
- 설명: base64 문자열을 원본 문자열로 디코딩합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 디코딩할 base64 문자열 |
- 반환값: `string` — 디코딩된 원본 문자열 (실패 시 `null`)
- 예시
  ```js
  const decoded = syn.$c.base64Decode(encoded);
  ```

### `syn.$c.utf8Encode(plainString)`
- 설명: 문자열을 UTF-8 바이트 배열(`Uint8Array`)로 인코딩합니다. 문자열이 아닌 값을 전달하면 `TypeError`를 발생시킵니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | plainString | string | Y | 인코딩할 문자열 |
- 반환값: `Uint8Array` — UTF-8 바이트 배열 (실패 시 `null`)
- 예시
  ```js
  const bytes = syn.$c.utf8Encode('안녕하세요');
  ```

### `syn.$c.utf8Decode(encodeString)`
- 설명: 콤마로 구분된 UTF-8 바이트 코드 문자열(예: `"236,149,136"`)을 원본 문자열로 디코딩합니다. 문자열이 아닌 값을 전달하면 `TypeError`를 발생시킵니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | encodeString | string | Y | 콤마로 구분된 바이트 코드 문자열 |
- 반환값: `string` — 디코딩된 문자열 (실패 시 `null`)
- 예시
  ```js
  const text = syn.$c.utf8Decode(bytes.join(','));
  ```

### `syn.$c.convertToBuffer(values)`
- 설명: 숫자 배열을 `ArrayBuffer`로 변환합니다. 다른 인코딩/디코딩 메서드 내부에서 사용되는 저수준 헬퍼입니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | values | number[] | Y | 0~255 범위의 바이트 값 배열 |
- 반환값: `ArrayBuffer`
- 예시
  ```js
  const buffer = syn.$c.convertToBuffer([104, 101, 108, 108, 111]);
  ```

### `syn.$c.padKey(key, length)`
- 설명: 키 문자열을 지정된 길이(byte)로 잘라내거나 0으로 채워서 고정 길이의 `Uint8Array`로 반환합니다. AES 키/IV 생성에 내부적으로 사용됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | key | string | Y | 원본 키 문자열 |
  | length | number | Y | 결과 바이트 길이 |
- 반환값: `Uint8Array` — 지정된 길이로 맞춰진 키 (key가 문자열이 아니면 `null`)
- 예시
  ```js
  const paddedKey = syn.$c.padKey('my-key', 16);
  ```

### `syn.$c.generateHMAC(key, message)`
- 설명: HMAC-SHA256 알고리즘으로 메시지의 서명을 생성합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | key | string | Y | 서명 생성에 사용할 키 |
  | message | string | Y | 서명할 메시지 |
- 반환값: `Promise<string>` — 16진수 문자열 형태의 HMAC 서명
- 예시
  ```js
  syn.$c.generateHMAC('handstack', 'hello world').then((signature) => {
      console.log(signature);
  });
  ```

### `syn.$c.verifyHMAC(key, message, signature)`
- 설명: 주어진 서명이 key/message로부터 생성한 HMAC 서명과 일치하는지 검증합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | key | string | Y | 서명 생성에 사용한 키 |
  | message | string | Y | 서명 대상 메시지 |
  | signature | string | Y | 검증할 HMAC 서명(16진수 문자열) |
- 반환값: `Promise<boolean>` — 서명 일치 여부
- 예시
  ```js
  syn.$c.verifyHMAC('handstack', 'hello world', signature).then((isValid) => {
      console.log(isValid);
  });
  ```

### `syn.$c.generateRSAKey()`
- 설명: RSA-OAEP(2048bit, SHA-256) 공개키/개인키 쌍을 생성합니다.
- 매개변수: 없음
- 반환값: `Promise<CryptoKeyPair>` — `{ publicKey, privateKey }` 형태의 `CryptoKey` 쌍
- 예시
  ```js
  syn.$c.generateRSAKey().then((cryptoKey) => {
      console.log(cryptoKey.publicKey, cryptoKey.privateKey);
  });
  ```

### `syn.$c.exportCryptoKey(cryptoKey, isPublic)`
- 설명: `CryptoKey`를 PEM(SPKI/PKCS8) 형식의 문자열로 내보냅니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | cryptoKey | CryptoKey | Y | 내보낼 키 |
  | isPublic | boolean | Y | true면 공개키(SPKI), false면 개인키(PKCS8) |
- 반환값: `Promise<string>` — `-----BEGIN PUBLIC/PRIVATE KEY-----` 형식의 PEM 문자열
- 예시
  ```js
  syn.$c.exportCryptoKey(cryptoKey.publicKey, true).then((pem) => console.log(pem));
  ```

### `syn.$c.importCryptoKey(pem, isPublic)`
- 설명: PEM 형식 문자열을 다시 `CryptoKey`로 가져옵니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | pem | string | Y | PEM 형식의 키 문자열 |
  | isPublic | boolean | Y | true면 공개키(SPKI, encrypt 용도), false면 개인키(PKCS8, decrypt 용도) |
- 반환값: `Promise<CryptoKey>`
- 예시
  ```js
  syn.$c.importCryptoKey(pemString, true).then((publicKey) => { /* ... */ });
  ```

### `syn.$c.rsaEncode(text, publicKey)`
- 설명: RSA-OAEP 공개키로 문자열을 암호화하고 base64 문자열로 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | string | Y | 암호화할 원문 |
  | publicKey | CryptoKey | Y | RSA 공개키 |
- 반환값: `Promise<string>` — base64 인코딩된 암호문
- 예시
  ```js
  syn.$c.rsaEncode('hello world', cryptoKey.publicKey).then((encrypted) => { /* ... */ });
  ```

### `syn.$c.rsaDecode(encryptedData, privateKey)`
- 설명: `rsaEncode()`로 암호화된 base64 문자열을 RSA-OAEP 개인키로 복호화합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | encryptedData | string | Y | base64 인코딩된 암호문 |
  | privateKey | CryptoKey | Y | RSA 개인키 |
- 반환값: `Promise<string>` — 복호화된 원문
- 예시
  ```js
  syn.$c.rsaDecode(encrypted, cryptoKey.privateKey).then((decrypted) => { /* ... */ });
  ```

### `syn.$c.generateIV(key, ivLength)`
- 설명: AES 암호화에 사용할 초기화 벡터(IV)를 생성합니다. `key`가 `'$RANDOM$'`(대소문자 무관)이면 난수 IV를 생성하고, 그 외에는 `padKey()`로 고정된 IV를 만듭니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | key | string | N | IV 생성에 사용할 키 또는 `'$RANDOM$'` |
  | ivLength | number | N | IV 길이(byte), 기본값 16 |
- 반환값: `Uint8Array` — 생성된 IV
- 예시
  ```js
  const iv = syn.$c.generateIV('$RANDOM$', 12);
  ```

### `syn.$c.aesEncode(text, key, algorithm, keyLength)`
- 설명: AES(CBC 또는 GCM) 알고리즘으로 문자열을 암호화합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | string | Y | 암호화할 원문 |
  | key | string | N | 암호화 키, 기본값 빈 문자열 |
  | algorithm | string | N | `'AES-CBC'`(기본) 또는 `'AES-GCM'` |
  | keyLength | number | N | 128 또는 256(bit), 기본값 256 |
- 반환값: `Promise<{ iv: string, encrypted: string }>` — base64로 인코딩된 IV와 암호문
- 예시
  ```js
  syn.$c.aesEncode('hello world', 'my-key').then((result) => { /* { iv, encrypted } */ });
  ```

### `syn.$c.aesDecode(encryptedData, key, algorithm, keyLength)`
- 설명: `aesEncode()`로 생성된 결과를 복호화합니다. 암호화 시 사용한 것과 동일한 key/algorithm/keyLength를 전달해야 합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | encryptedData | { iv, encrypted } | Y | `aesEncode()` 결과 객체 |
  | key | string | N | 암호화 시 사용한 키 |
  | algorithm | string | N | `'AES-CBC'`(기본) 또는 `'AES-GCM'` |
  | keyLength | number | N | 128 또는 256(bit), 기본값 256 |
- 반환값: `Promise<string>` — 복호화된 원문 (encryptedData가 유효하지 않으면 `null`)
- 예시
  ```js
  syn.$c.aesDecode(result, 'my-key').then((decrypted) => { /* ... */ });
  ```

### `syn.$c.sha(message, algorithms)`
- 설명: WebCrypto `digest`를 사용해 지정한 알고리즘으로 메시지의 해시 값을 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | message | string | Y | 해시를 계산할 문자열 |
  | algorithms | string | N | `'SHA-1'`(기본), `'SHA-256'`, `'SHA-384'`, `'SHA-512'` 등 |
- 반환값: `Promise<string>` — 16진수 문자열 형태의 해시 값
- 예시
  ```js
  syn.$c.sha('hello world', 'SHA-256').then((hash) => console.log(hash));
  ```

### `syn.$c.sha256(s)`
- 설명: 순수 자바스크립트로 구현된 SHA-256 해시 함수로, WebCrypto 없이 동기적으로 결과를 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | s | string | Y | 해시를 계산할 문자열 |
- 반환값: `string` — 16진수 문자열 형태의 SHA-256 해시 값
- 예시
  ```js
  const hash = syn.$c.sha256('hello world');
  ```

### `syn.$c.encrypt(value, key)`
- 설명: 문자 코드 치환 방식의 경량 대칭 암호화를 수행하고 URI 컴포넌트로 인코딩된 base64 문자열을 반환합니다. WebCrypto가 없어도 사용할 수 있습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | value | any | Y | 암호화할 값(문자열로 변환되어 처리됨) |
  | key | string | N | 암호화 키, 생략 시 내부 기본 키 사용 |
- 반환값: `string` — 암호화된 문자열 (`value`가 `undefined`/`null`이면 `null`)
- 예시
  ```js
  const encrypted = syn.$c.encrypt('hello world', 'my-key');
  ```

### `syn.$c.decrypt(value, key)`
- 설명: `encrypt()`로 암호화된 문자열을 원래 값으로 복호화합니다. key가 일치하지 않으면 빈 문자열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | value | string | Y | `encrypt()`로 암호화된 문자열 |
  | key | string | N | 암호화 시 사용한 키 |
- 반환값: `string` — 복호화된 원문 (형식이 올바르지 않으면 `null`)
- 예시
  ```js
  const decrypted = syn.$c.decrypt(encrypted, 'my-key');
  ```

### `syn.$c.LZString.compress(uncompressed)`
- 설명: 문자열을 LZString 알고리즘으로 압축하여 임의 문자(16bit) 코드 문자열로 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | uncompressed | string | Y | 압축할 원본 문자열 |
- 반환값: `string` — 압축된 문자열
- 예시
  ```js
  const compressed = syn.$c.LZString.compress('반복되는 긴 문자열...');
  ```

### `syn.$c.LZString.compressToBase64(input)` / `decompressFromBase64(input)`
- 설명: 문자열을 압축해 base64 alphabet 기반 문자열로 인코딩하거나, 그 결과를 원래 문자열로 해제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | input | string | Y | 압축할 원본 문자열 또는 압축 해제할 base64 문자열 |
- 반환값: `string`
- 예시
  ```js
  const compressed = syn.$c.LZString.compressToBase64('반복되는 긴 문자열...');
  const original = syn.$c.LZString.decompressFromBase64(compressed);
  ```

### `syn.$c.LZString.compressToUTF16(input)` / `decompressFromUTF16(compressed)`
- 설명: 문자열을 압축해 UTF-16 안전 문자열로 인코딩하거나, 그 결과를 원래 문자열로 해제합니다. localStorage처럼 UTF-16 문자열을 저장하는 저장소에 적합합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | input / compressed | string | Y | 압축할 원본 문자열 또는 압축 해제할 UTF-16 문자열 |
- 반환값: `string`
- 예시
  ```js
  const compressed = syn.$c.LZString.compressToUTF16('반복되는 긴 문자열...');
  const original = syn.$c.LZString.decompressFromUTF16(compressed);
  ```

### `syn.$c.LZString.compressToUint8Array(uncompressed)` / `decompressFromUint8Array(compressed)`
- 설명: 문자열을 압축해 `Uint8Array`로 반환하거나, `Uint8Array`를 원래 문자열로 해제합니다. 바이너리 저장소나 전송에 적합합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | uncompressed / compressed | string \| Uint8Array | Y | 압축할 문자열 또는 압축 해제할 `Uint8Array` |
- 반환값: `Uint8Array` 또는 `string`
- 예시
  ```js
  const buffer = syn.$c.LZString.compressToUint8Array('반복되는 긴 문자열...');
  const original = syn.$c.LZString.decompressFromUint8Array(buffer);
  ```

### `syn.$c.LZString.compressToEncodedURIComponent(input)` / `decompressFromEncodedURIComponent(input)`
- 설명: 문자열을 압축해 URL 쿼리 파라미터로 바로 사용할 수 있는 URI-safe 문자열로 인코딩하거나, 그 결과를 원래 문자열로 해제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | input | string | Y | 압축할 원본 문자열 또는 압축 해제할 URI-safe 문자열 |
- 반환값: `string`
- 예시
  ```js
  const compressed = syn.$c.LZString.compressToEncodedURIComponent('반복되는 긴 문자열...');
  location.search = `?data=${compressed}`;
  ```
