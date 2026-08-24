# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository.

## What this is

`HandStack.Bootstrapper` is a cross-platform (Windows / macOS / Ubuntu) .NET 10 console app that
silently installs a fixed set of dev-environment prerequisites in one run: .NET SDK 10 (GA only,
never preview/RC), Node.js LTS, PowerShell (`pwsh`), git, curl, gulp-cli, and
Microsoft.Web.LibraryManager.Cli (`libman`). It ships as a self-contained single-file executable per
OS, packaged/distributed via Velopack.

## Commands

Build:
```
dotnet build HandStack.Bootstrapper.slnx -c Debug
```

Run locally without publishing (requires a .NET SDK already on the dev machine):
```
dotnet run --project src/HandStack.Bootstrapper.csproj
```

Publish a self-contained single-file build for one OS (uses the matching `.pubxml` under
`src/Properties/PublishProfiles/`):
```
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=win-x64
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=osx-arm64
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=osx-x64
dotnet publish src/HandStack.Bootstrapper.csproj -c Release -p:PublishProfile=linux-x64
```

Package a Velopack release (publish + `vpk pack`; install the CLI once per machine with
`dotnet tool install -g vpk`, and run each script on its matching OS — Velopack builds are not
cross-compiled):
```
./build/pack-windows.ps1 -Version 1.0.0
./build/pack-macos.sh 1.0.0
./build/pack-linux.sh 1.0.0
```

There is no test suite in this repository.

## Architecture

Single project (`src/HandStack.Bootstrapper.csproj`, TFM `net10.0`), no test project.

**Orchestration**: `Program.cs` is the entry point (top-level statements). It calls
`VelopackApp.Build().Run()` first — Velopack's install/update/uninstall lifecycle hook — which must
stay the very first statement. It then runs a fixed 8-step sequence against one `IPlatformInstaller`
chosen via `OperatingSystem.IsWindows()/IsMacOS()/IsLinux()`: prerequisites → .NET SDK 10 → Node.js
LTS → PowerShell → git → curl → gulp-cli → libman.

**Per-OS strategy** (`Platform/IPlatformInstaller.cs` + `WindowsInstaller.cs` / `MacInstaller.cs` /
`LinuxInstaller.cs`, each `[SupportedOSPlatform(...)]`-guarded): every install method independently
checks whether the tool is already present (via `InstallChecks`) before doing anything, so re-running
the app is idempotent. Package manager per OS: winget (Windows), Homebrew (macOS), apt + NodeSource
(Ubuntu). `gulp-cli` and `libman` are OS-agnostic (`Platform/AdditionalTools.cs`) since they install
via npm / `dotnet tool` regardless of OS.

**.NET SDK install is special**: all three OS installers delegate to
`Platform/DotNetInstallHelper.cs`, which always uses Microsoft's official `dotnet-install` script
(`.ps1` on Windows, `.sh` on macOS/Linux) pinned to channel `"10.0"` (the `DotNetChannel` constant in
`Program.cs`) instead of the OS package manager — this guarantees major version 10 specifically.
`InstallChecks.IsDotNetSdkChannelInstalledAsync` enforces the same rule when deciding whether to skip:
it rejects any installed SDK whose version string carries a prerelease `-` suffix (rc/preview builds
don't count as "already installed"). Don't change `DotNetChannel` off `"10.0"` without also revisiting
that check — the "must be version 10, GA only" requirement is intentional, not incidental.

**Same-process PATH problem (Windows)**: winget / `dotnet-install` update the registry's PATH but not
the current process's environment block, so a tool installed earlier in the same run (e.g. Node.js)
would otherwise be invisible to a later step in the same run (e.g. `npm install -g gulp-cli`).
`Platform/WindowsPath.cs` refreshes `Environment.SetEnvironmentVariable("Path", ...)` after each
winget install and after the .NET SDK install (also prepending `%USERPROFILE%\.dotnet\tools`) to work
around this. Separately, npm-installed commands (`npm`, `gulp`) are `.cmd` shims on Windows that
`Process.Start` can't launch directly (no PATHEXT resolution), so `AdditionalTools.cs` routes those
specific calls through `cmd /c`.

**Elevation is self-service, not the caller's job**: `WindowsInstaller.EnsurePrerequisitesAsync()`
detects non-elevation and relaunches itself with `Verb = "runas"` (triggers the UAC prompt), exiting
the original process on success. `LinuxInstaller.EnsurePrerequisitesAsync()` does the analogous thing
by re-execing itself under `sudo` with stdio inherited (the password prompt appears in the same
terminal), then exits with the child's exit code. Both relaunch paths only work for the published
self-contained exe (they read `Environment.ProcessPath`) — they intentionally no-op when running under
`dotnet run`/`dotnet exec`, since the real target to relaunch can't be determined from the dotnet host
path; the caller then falls through to a manual-relaunch error message. `MacInstaller` deliberately
does **not** elevate the whole process — Homebrew refuses to run as root — so only the one `.NET SDK`
install step shells out through `sudo` internally, inside `DotNetInstallHelper`.

**Process execution**: all shelling-out goes through `ProcessRunner.cs` — `RunAsync` streams
stdout/stderr live and throws on non-zero exit (unless `requireSuccess: false`); `CaptureAsync` is the
non-throwing, non-streaming variant used by `InstallChecks` / `AdditionalTools` for "is X already
installed" probes (returns exit code `-1` on any failure to start, including "command not found").

**Packaging**: `RuntimeIdentifiers` / `SelfContained` / `PublishSingleFile` are set at the project
level in the `.csproj`, and mirrored per-RID in `Properties/PublishProfiles/*.pubxml` (`win-x64`,
`osx-x64`, `osx-arm64`, `linux-x64`) so `dotnet publish -p:PublishProfile=<rid>` and Visual Studio's
Publish dialog both produce a single-file, self-contained executable. The `build/pack-*.{ps1,sh}`
scripts chain that publish step into `vpk pack` to produce a Velopack release; `vpk pack` itself only
consumes an already-published folder — it has no publish-profile awareness, so the publish step must
run first in every packaging script.
