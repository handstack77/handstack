# 암호화(cryptography) 사용법 (syn.$c)

## 개요
`syn.$c`는 base64/UTF-8 인코딩, SHA 해시, HMAC 서명, RSA/AES 암호화, LZString 압축 등 브라우저에서 필요한 암호화·인코딩 기능을 제공합니다. 대부분의 기능은 브라우저 WebCrypto(SubtleCrypto) API를 사용하며, 비동기(Promise) 방식으로 동작합니다. `sha256()`, `encrypt()`, `decrypt()`처럼 WebCrypto 없이 동작하는 동기 방식의 경량 구현도 함께 제공됩니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$c`(원본 이름: `syn.$cryptography`)로 즉시 사용할 수 있습니다.

## 빠른 시작
```js
// 문자열 해시
const hash = syn.$c.sha256('hello world');

// base64 인코딩/디코딩
const encoded = syn.$c.base64Encode('안녕하세요');
const decoded = syn.$c.base64Decode(encoded);

// HMAC 서명 생성 (비동기)
syn.$c.generateHMAC('secret-key', 'hello world').then((signature) => {
    console.log(signature);
});
```

## 주요 시나리오

### 1. 간단한 해시/인코딩
`sha256()`은 동기 함수라 바로 결과를 받을 수 있고, `sha()`는 WebCrypto digest를 사용해 SHA-1/SHA-256/SHA-384/SHA-512 등 다양한 알고리즘을 비동기로 계산합니다.
```js
const hash256 = syn.$c.sha256('hello world');

syn.$c.sha('hello world', 'SHA-256').then((hash) => {
    console.log(hash);
});
```

### 2. HMAC 서명 생성/검증
서버와 클라이언트가 공유한 키로 메시지 위변조 여부를 검증할 때 사용합니다.
```js
syn.$c.generateHMAC('handstack', 'hello world').then((signature) => {
    return syn.$c.verifyHMAC('handstack', 'hello world', signature);
}).then((isValid) => {
    console.log(isValid); // true
});
```

### 3. RSA 키 생성과 암/복호화
공개키로 암호화하고 개인키로 복호화하는 비대칭 암호화 흐름입니다. 키를 PEM 형식으로 내보내고(export) 다시 가져올(import) 수 있습니다.
```js
syn.$c.generateRSAKey().then((cryptoKey) => {
    return syn.$c.rsaEncode('hello world', cryptoKey.publicKey).then((encrypted) => {
        return syn.$c.rsaDecode(encrypted, cryptoKey.privateKey);
    });
}).then((decrypted) => {
    console.log(decrypted); // hello world
});
```

### 4. AES 대칭키 암호화
`aesEncode()`는 IV(초기화 벡터)와 암호문을 함께 반환하며, 복호화 시 동일한 키와 IV가 필요합니다.
```js
syn.$c.aesEncode('hello world', 'my-key').then((result) => {
    // result = { iv, encrypted }
    return syn.$c.aesDecode(result, 'my-key');
}).then((decrypted) => {
    console.log(decrypted); // hello world
});
```

### 5. 경량 대칭 암호화(encrypt/decrypt)
WebCrypto 없이도 사용할 수 있는 간단한 문자열 암호화입니다. 세션 스토리지에 저장할 값을 가볍게 가리는 용도로 적합합니다.
```js
const encrypted = syn.$c.encrypt('hello world', 'my-key');
const decrypted = syn.$c.decrypt(encrypted, 'my-key');
```

### 6. LZString 압축
긴 문자열을 URL 파라미터나 localStorage에 저장하기 전에 압축할 때 사용합니다. 압축 결과 형식(base64/UTF-16/URI 컴포넌트)에 맞는 해제 함수를 사용해야 합니다.
```js
const compressed = syn.$c.LZString.compressToBase64('반복되는 긴 문자열...');
const original = syn.$c.LZString.decompressFromBase64(compressed);
```

## 실전 예제 페이지
`/sample/syn/cryptography.html` 예제에서 다음 항목을 실습할 수 있습니다.
- isWebCryptoSupported, base64Encode/base64Decode, utf8Encode/utf8Decode
- padKey, convertToBuffer
- sha, sha256
- generateHMAC/verifyHMAC
- generateRSAKey/exportCryptoKey/importCryptoKey, rsaEncode/rsaDecode
- generateIV, aesEncode/aesDecode
- encrypt/decrypt
- LZString의 compress/compressToBase64/compressToUTF16/compressToEncodedURIComponent 및 대응하는 decompress 계열 함수

## 주의 사항
- WebCrypto 기반 API(`generateHMAC`, `generateRSAKey`, `exportCryptoKey`, `importCryptoKey`, `rsaEncode`, `rsaDecode`, `aesEncode`, `aesDecode`, `sha`)는 모두 비동기(Promise)이며, HTTPS(또는 localhost)가 아닌 환경에서는 `context.crypto.subtle`이 없어 동작하지 않을 수 있습니다. 사용 전 `isWebCryptoSupported()`로 확인하는 것이 안전합니다.
- `aesDecode()`는 암호화 시 사용한 것과 동일한 key, algorithm, keyLength를 전달해야 하며, `encryptedData`에 `iv`와 `encrypted` 값이 모두 있어야 합니다.
- `padKey()`, `convertToBuffer()`, `generateIV()`는 다른 메서드 내부에서 사용되는 저수준 헬퍼이지만 `syn.$c`를 통해 외부에서도 호출할 수 있습니다.
- 소스에는 `devicePlatform === 'node'`일 때 `Buffer`를 사용하는 Node.js 전용 경로가 `base64Encode`/`base64Decode`에 별도로 구현되어 있습니다. 브라우저 데모 페이지에서는 이 경로가 실행되지 않지만, 서버 사이드(Node) 스크립트에서 동일한 API를 재사용할 수 있다는 점을 참고하세요.
- `encrypt()`/`decrypt()`는 WebCrypto를 사용하지 않는 간단한 치환 방식이므로, 보안이 중요한 데이터에는 AES/RSA 계열 API를 사용하는 것이 좋습니다.

## 관련 모듈
- API 상세: [`cryptography_api.md`](./cryptography_api.md)
