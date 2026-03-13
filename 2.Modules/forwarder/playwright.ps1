#!/usr/bin/env pwsh
#
# forwarder Playwright 런처 스크립트
#
# 설명:
#   Microsoft.Playwright 어셈블리를 메모리에서 로드한 뒤
#   Playwright CLI 진입점을 현재 인수 그대로 실행합니다.
#   DLL 파일 잠금을 피하기 위해 파일을 직접 참조하지 않고 바이트 배열로 로드합니다.
#
# 사용법:
#   Windows: ./playwright.ps1 [arguments]
#   macOS/Linux: ./playwright.ps1 [arguments]

# Playwright 드라이버 검색 경로를 현재 스크립트 디렉터리로 고정합니다.
$Env:PLAYWRIGHT_DRIVER_SEARCH_PATH = $PSScriptRoot;
$playwrightLibrary = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, "Microsoft.Playwright.dll"))
# DLL 잠금을 피하기 위해 메모리에서 바로 로드합니다.
[Reflection.Assembly]::Load([System.IO.File]::ReadAllBytes($playwrightLibrary)) | Out-Null
exit [Microsoft.Playwright.Program]::Main($args)
