#!/usr/bin/env pwsh
<#
.SYNOPSIS
    rdy 프로젝트의 설정 파일에 사용된 포트 값을 한 번에 변경합니다.

.DESCRIPTION
    appsettings.json과 modules 하위의 모든 module.json에서 현재 포트를
    새 포트로 치환합니다. 소스 디렉터리에서는 rdy.csproj의 RdyServerPort를
    함께 변경하고, 빌드 산출물에서는 생성된 syn.config.json을 변경합니다.
    포트는 다른 숫자의 일부가 아닌 독립된 값일 때만 변경합니다.
    Windows, macOS, Ubuntu의 PowerShell 7 이상에서 동일하게 실행할 수 있습니다.

.PARAMETER CurrentPort
    설정 파일에서 찾을 현재 포트입니다.

.PARAMETER NewPort
    현재 포트를 대신할 새 포트입니다.

.EXAMPLE
    pwsh ./task.ps1 8420 9420

.EXAMPLE
    sh ./task.sh 8420 9420
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$CurrentPort,

    [Parameter(Position = 1)]
    [string]$NewPort,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$AdditionalArguments
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function ConvertTo-Port {
    param(
        [string]$Value,
        [string]$ParameterName
    )

    $port = 0
    $isValid = [int]::TryParse(
        $Value,
        [System.Globalization.NumberStyles]::None,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [ref]$port
    )

    if (-not $isValid -or $port -lt 1 -or $port -gt 65535) {
        throw "${ParameterName} 값이 올바르지 않습니다: ${Value}. 1부터 65535 사이의 값을 입력하세요."
    }

    return $port
}

try {
    $hasAdditionalArguments = $null -ne $AdditionalArguments -and $AdditionalArguments.Count -gt 0
    if ([string]::IsNullOrWhiteSpace($CurrentPort) -or
        [string]::IsNullOrWhiteSpace($NewPort) -or
        $hasAdditionalArguments) {
        throw '사용법: task.ps1 <현재-포트> <새-포트> (예시: task.ps1 8420 9420)'
    }

    $currentPortValue = ConvertTo-Port -Value $CurrentPort -ParameterName '현재 포트'
    $newPortValue = ConvertTo-Port -Value $NewPort -ParameterName '새 포트'

    if ($currentPortValue -eq $newPortValue) {
        throw '현재 포트와 새 포트는 서로 달라야 합니다.'
    }

    $root = [System.IO.Path]::GetFullPath($PSScriptRoot)
    $appSettings = Join-Path $root 'appsettings.json'
    $moduleRoot = Join-Path $root 'modules'
    $projectFile = Join-Path $root 'rdy.csproj'
    $synConfig = Join-Path (Join-Path (Join-Path $moduleRoot 'wwwroot') 'wwwroot') 'syn.config.json'

    foreach ($requiredPath in @($appSettings, $moduleRoot)) {
        if (-not (Test-Path -LiteralPath $requiredPath)) {
            throw "필수 경로를 찾을 수 없습니다: ${requiredPath}"
        }
    }

    $hasProjectFile = Test-Path -LiteralPath $projectFile -PathType Leaf
    $hasSynConfig = Test-Path -LiteralPath $synConfig -PathType Leaf

    if (-not $hasProjectFile -and -not $hasSynConfig) {
        throw "rdy.csproj 또는 생성된 syn.config.json을 찾을 수 없습니다: ${root}"
    }

    $moduleFiles = @(
        Get-ChildItem -LiteralPath $moduleRoot -Recurse -File -Filter 'module.json' |
            Select-Object -ExpandProperty FullName
    )

    if ($moduleFiles.Count -eq 0) {
        throw "다음 경로에서 module.json 파일을 찾을 수 없습니다: ${moduleRoot}"
    }

    $files = @($appSettings) + $moduleFiles
    if ($hasSynConfig) {
        $files += $synConfig
    }
    $oldPort = $currentPortValue.ToString([System.Globalization.CultureInfo]::InvariantCulture)
    $replacementPort = $newPortValue.ToString([System.Globalization.CultureInfo]::InvariantCulture)
    $pattern = '(?<!\d)' + [regex]::Escape($oldPort) + '(?!\d)'
    $changes = @()

    foreach ($file in ($files | Sort-Object -Unique)) {
        $content = [System.IO.File]::ReadAllText($file)
        $matchCount = [regex]::Matches($content, $pattern).Count

        if ($matchCount -gt 0) {
            $updated = [regex]::Replace($content, $pattern, $replacementPort)
            $null = $updated | ConvertFrom-Json
            $changes += [pscustomobject]@{
                Path    = $file
                Updated = $updated
                Count   = $matchCount
            }
        }
    }

    if ($hasProjectFile) {
        $projectContent = [System.IO.File]::ReadAllText($projectFile)
        $projectPattern = '(<RdyServerPort(?:\s[^>]*)?>\s*)' +
            [regex]::Escape($oldPort) +
            '(?=\s*</RdyServerPort>)'
        $projectMatchCount = [regex]::Matches($projectContent, $projectPattern).Count

        if ($projectMatchCount -ne 1) {
            throw "rdy.csproj의 RdyServerPort에서 현재 포트 ${oldPort}을(를) 정확히 한 번 찾을 수 있어야 합니다."
        }

        $updatedProject = [regex]::Replace(
            $projectContent,
            $projectPattern,
            ('${1}' + $replacementPort)
        )
        $null = [xml]$updatedProject
        $changes += [pscustomobject]@{
            Path    = $projectFile
            Updated = $updatedProject
            Count   = $projectMatchCount
        }
    }

    if ($changes.Count -eq 0) {
        throw "대상 파일에서 현재 포트 ${oldPort}을(를) 찾을 수 없습니다."
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    foreach ($change in $changes) {
        [System.IO.File]::WriteAllText($change.Path, $change.Updated, $utf8NoBom)
        $relativePath = $change.Path.Substring($root.Length).TrimStart(
            [System.IO.Path]::DirectorySeparatorChar,
            [System.IO.Path]::AltDirectorySeparatorChar
        )
        Write-Host ('변경: {0} ({1}개 항목)' -f $relativePath, $change.Count)
    }

    $totalCount = ($changes | Measure-Object -Property Count -Sum).Sum
    Write-Host (
        '완료: {0}개 파일, {1}개 항목, {2} -> {3}' -f
            $changes.Count,
            $totalCount,
            $oldPort,
            $replacementPort
    )
}
catch {
    [Console]::Error.WriteLine('오류: {0}', $_.Exception.Message)
    exit 1
}
