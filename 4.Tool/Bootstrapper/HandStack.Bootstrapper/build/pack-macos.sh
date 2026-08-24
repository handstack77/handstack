#!/usr/bin/env bash
# 부트스트래퍼를 게시(publish)하고 macOS용 Velopack 릴리스로 패키징한다.
# macOS 머신에서 실행할 것. `vpk` 전역 도구가 필요하다:
#   dotnet tool install -g vpk
set -euo pipefail

VERSION="${1:-1.0.0}"
PACKAGE_ID="${2:-HandStack.Bootstrapper}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RID="${RID:-osx-arm64}"   # 인텔 맥이라면 RID=osx-x64 로 지정
PUBLISH_DIR="$ROOT/publish/$RID"
RELEASE_DIR="$ROOT/releases/$RID"

echo "게시 중 ($RID 게시 프로필)..."
dotnet publish "$ROOT/src/HandStack.Bootstrapper.csproj" \
    -c Release -p:PublishProfile="$RID" \
    -o "$PUBLISH_DIR"

echo "vpk로 패키징 중..."
# vpk 버전에 따라 플래그 이름이 달라질 수 있다. 실패하면 설치된 버전 기준으로
# `vpk pack --help`를 실행해 확인할 것.
vpk pack \
    --packId "$PACKAGE_ID" \
    --packVersion "$VERSION" \
    --packDir "$PUBLISH_DIR" \
    --mainExe "HandStack.Bootstrapper" \
    --outputDir "$RELEASE_DIR" \
    --runtime "$RID"

echo "완료 -> $RELEASE_DIR"
