param(
    [ValidateSet('Debug', 'Release')][string]$Configuration = 'Debug',
    [string]$Project = '',
    [string]$Filter = ''
)
$ErrorActionPreference = 'Stop'
$runtime = Join-Path ([IO.Path]::GetTempPath()) ('handstack-tests-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $runtime | Out-Null
$projects = @(@('1.WebHost', '2.Modules', '3.Infrastructure') |
    ForEach-Object { Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot $_) -Directory } |
    ForEach-Object { Get-ChildItem -LiteralPath $_.FullName -Filter '*.csproj' -File } |
    Where-Object { $Project -eq '' -or $_.BaseName -eq $Project } | Sort-Object Name)
if ($projects.Count -eq 0) { throw "테스트 프로젝트를 찾지 못했습니다: $Project" }
$previousHome = $env:HANDSTACK_HOME
$previousTestHome = $env:HANDSTACK_TEST_HOME
$results = @()
try {
    $env:HANDSTACK_HOME = $runtime
    $env:HANDSTACK_TEST_HOME = $runtime
    foreach ($testProject in $projects) {
        $arguments = @('test', $testProject.FullName, '-c', $Configuration, '-m:1', "-p:HANDSTACK_HOME=$runtime", "-p:RdyWwwrootOutputDir=$runtime/rdy-wwwroot", '--results-directory', $runtime, '--logger', "trx;LogFileName=$($testProject.BaseName).trx", '--logger', 'console;verbosity=minimal')
        if ($Filter -ne '') { $arguments += @('--filter', $Filter) }
        # 같은 원본 프로젝트를 여러 테스트가 참조하므로 프로젝트 사이의 빌드는 순서대로 수행한다.
        & dotnet @arguments
        $exitCode = $LASTEXITCODE
        $reportPath = Join-Path $runtime "$($testProject.BaseName).trx"
        $passed = 0; $failed = 0; $skipped = 0
        if (Test-Path -LiteralPath $reportPath) {
            [xml]$report = Get-Content -LiteralPath $reportPath -Raw
            $passed = [int]$report.TestRun.ResultSummary.Counters.passed
            $failed = [int]$report.TestRun.ResultSummary.Counters.failed
            # xUnit TRX의 Counters.notExecuted는 건너뜀이 있어도 0일 수 있다.
            $skipped = @($report.TestRun.Results.UnitTestResult | Where-Object outcome -eq 'NotExecuted').Count
            if ($Filter -eq '' -and $passed + $failed + $skipped -eq 0) { $exitCode = 1 }
        } else { $exitCode = 1 }
        $results += [pscustomobject]@{ Project = $testProject.BaseName; Passed = $passed; Failed = $failed; Skipped = $skipped; ExitCode = $exitCode }
    }
} finally {
    $env:HANDSTACK_HOME = $previousHome
    $env:HANDSTACK_TEST_HOME = $previousTestHome
}
$results | Format-Table -AutoSize
Write-Host "프로젝트 $($results.Count)개, 통과 $(($results | Measure-Object Passed -Sum).Sum), 실패 $(($results | Measure-Object Failed -Sum).Sum), 건너뜀 $(($results | Measure-Object Skipped -Sum).Sum)"
Write-Host "격리 빌드·TRX 결과: $runtime"
if (@($results | Where-Object ExitCode -ne 0).Count -gt 0) { exit 1 }
