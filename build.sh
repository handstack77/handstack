#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECTS=(
  "2.Modules/checkup/checkup.csproj"
  "2.Modules/dbclient/dbclient.csproj"
  "2.Modules/forwarder/forwarder.csproj"
  "2.Modules/function/function.csproj"
  "2.Modules/logger/logger.csproj"
  "2.Modules/repository/repository.csproj"
  "2.Modules/transact/transact.csproj"
  "2.Modules/wwwroot/wwwroot.csproj"
  "1.WebHost/ack/ack.csproj"
  "1.WebHost/agent/agent.csproj"
  "1.WebHost/deploy/deploy.csproj"
  "1.WebHost/forbes/forbes.csproj"
  "4.Tool/CLI/bundling/bundling.csproj"
  "4.Tool/CLI/dotnet-installer/dotnet-installer.csproj"
  "4.Tool/CLI/edgeproxy/edgeproxy.csproj"
  "4.Tool/CLI/excludedportrange/excludedportrange.csproj"
  "4.Tool/CLI/handsonapp/handsonapp.csproj"
  "4.Tool/CLI/handstack/handstack.csproj"
  "4.Tool/CLI/ports/ports.csproj"
  "4.Tool/CLI/launcher/launcher.csproj"
)

build_project() {
  local project_path="$1"
  local project_name
  project_name="$(basename "${project_path%.*}")"

  echo "Building ${project_name}..."
  run_dotnet build "$project_path" -c Debug
}

run_dotnet() {
  if ! dotnet "$@"; then
    echo ""
    echo "ERROR: dotnet command failed: dotnet $*"
    exit 1
  fi
}

echo "Restoring solution packages..."
run_dotnet restore handstack.sln

echo "Cleaning solution..."
run_dotnet clean handstack.sln

for project in "${PROJECTS[@]}"; do
  build_project "$project"
done

echo "All projects built successfully."

