FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

ARG ACTION_MODE=build
ARG CONFIGURATION_MODE=Debug
ARG OS_MODE=linux
ARG ARCH_MODE=x64
ARG OPTIMIZE_FLAG=false
ARG RID=linux-x64

ENV HANDSTACK_HOME=/tmp/handstack-home

COPY ["1.WebHost/ack/", "1.WebHost/ack/"]
COPY ["4.Tool/CLI/handstack/", "4.Tool/CLI/handstack/"]
COPY ["2.Modules/", "2.Modules/"]
COPY ["3.Infrastructure/Assemblies/", "3.Infrastructure/Assemblies/"]
COPY ["install.bat", "install.bat"]
COPY ["install.ps1", "install.ps1"]
COPY ["install.sh", "install.sh"]
COPY ["lib.zip", "lib.zip"]

RUN dotnet restore "1.WebHost/ack/ack.csproj" \
    && dotnet restore "4.Tool/CLI/handstack/handstack.csproj"

RUN mkdir -p /opt/seed/handstack/app \
    && mkdir -p /opt/seed/handstack/app/cli \
    && mkdir -p /opt/seed/handstack/modules \
    && dotnet "$ACTION_MODE" -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" --arch "$ARCH_MODE" --os "$OS_MODE" "1.WebHost/ack/ack.csproj" --output /opt/seed/handstack/app \
    && dotnet "$ACTION_MODE" -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" --arch "$ARCH_MODE" --os "$OS_MODE" "4.Tool/CLI/handstack/handstack.csproj" --output /opt/seed/handstack/app/cli \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/dbclient/dbclient.csproj" --output /opt/seed/handstack/modules/dbclient \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/function/function.csproj" --output /opt/seed/handstack/modules/function \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/logger/logger.csproj" --output /opt/seed/handstack/modules/logger \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/repository/repository.csproj" --output /opt/seed/handstack/modules/repository \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/transact/transact.csproj" --output /opt/seed/handstack/modules/transact \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/wwwroot/wwwroot.csproj" --output /opt/seed/handstack/modules/wwwroot \
    && dotnet build -p:Optimize=$OPTIMIZE_FLAG --configuration "$CONFIGURATION_MODE" "2.Modules/checkup/checkup.csproj" --output /opt/seed/handstack/modules/checkup

RUN mkdir -p /opt/seed/handstack/contracts \
    && if [ -d /src/contracts ]; then cp -a /src/contracts/. /opt/seed/handstack/contracts/; fi \
    && cp -a /src/install.bat /src/install.ps1 /src/install.sh /opt/seed/handstack/ \
    && cp -a /src/lib.zip /opt/seed/handstack/lib.zip \
    && find /src/2.Modules/function -maxdepth 1 -type f -name "package*.*" -exec cp -a {} /opt/seed/handstack/ \;

RUN wwwroot_js_path="/opt/seed/handstack/modules/wwwroot/wwwroot" \
    && if [ -d "$wwwroot_js_path/lib" ]; then rm -rf "$wwwroot_js_path/lib"; fi \
    && find /opt/seed/handstack -type f \( -name "*.staticwebassets.endpoints.json" -o -name "*.staticwebassets.runtime.json" \) -delete \
    && for runtimes_dir in $(find /opt/seed/handstack -type d -name runtimes); do \
        for entry in "$runtimes_dir"/*; do \
            [ -e "$entry" ] || continue; \
            if [ -d "$entry" ]; then \
                if [ "$(basename "$entry")" != "$RID" ]; then rm -rf "$entry"; fi; \
            else \
                rm -f "$entry"; \
            fi; \
        done; \
    done

RUN rm -rf /opt/seed/handstack/assemblies \
    && mkdir -p /opt/seed/handstack/assemblies \
    && cp -a /src/3.Infrastructure/Assemblies/. /opt/seed/handstack/assemblies/

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /opt/bootstrap

ENV ASPNETCORE_URLS=http://0.0.0.0:8421
ENV HANDSTACK_HOME=/handstack
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl nodejs npm ca-certificates \
    && npm install -g gulp-cli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8421

COPY --from=build /opt/seed /opt/seed
COPY ["1.WebHost/ack/docker-entrypoint.sh", "/usr/local/bin/docker-entrypoint.sh"]

RUN set -eux; \
    HANDSTACK_HOME=/opt/seed/handstack; \
    APP_DIR="${HANDSTACK_HOME}/app"; \
    MODULE_WWWROOT_DIR="${HANDSTACK_HOME}/modules/wwwroot"; \
    MODULE_WWWROOT_LIB_DIR="${MODULE_WWWROOT_DIR}/wwwroot/lib"; \
    MODULE_WWWROOT_LIB_ZIP="${MODULE_WWWROOT_DIR}/wwwroot/lib.zip"; \
    if [ -f "${HANDSTACK_HOME}/package.json" ] && [ ! -d "${HANDSTACK_HOME}/node_modules" ]; then \
      (cd "${HANDSTACK_HOME}" && npm install); \
    fi; \
    mkdir -p "${HANDSTACK_HOME}/node_modules/syn"; \
    if [ -f "${APP_DIR}/wwwroot/assets/js/index.js" ]; then \
      cp -f "${APP_DIR}/wwwroot/assets/js/index.js" "${HANDSTACK_HOME}/node_modules/syn/index.js"; \
    fi; \
    if [ -f "${APP_DIR}/package.json" ] && [ ! -d "${APP_DIR}/node_modules" ]; then \
      (cd "${APP_DIR}" && npm install); \
    fi; \
    if [ ! -d "${MODULE_WWWROOT_LIB_DIR}" ]; then \
      mkdir -p "$(dirname "${MODULE_WWWROOT_LIB_ZIP}")"; \
      if [ ! -f "${MODULE_WWWROOT_LIB_ZIP}" ] && [ -f "${HANDSTACK_HOME}/lib.zip" ]; then \
        cp -f "${HANDSTACK_HOME}/lib.zip" "${MODULE_WWWROOT_LIB_ZIP}"; \
      fi; \
      if [ -f "${MODULE_WWWROOT_LIB_ZIP}" ]; then \
        if [ -f "${APP_DIR}/cli/handstack.dll" ]; then \
          dotnet "${APP_DIR}/cli/handstack.dll" extract --file="${MODULE_WWWROOT_LIB_ZIP}" --directory="${MODULE_WWWROOT_LIB_DIR}"; \
        elif [ -x "${APP_DIR}/cli/handstack" ]; then \
          "${APP_DIR}/cli/handstack" extract --file="${MODULE_WWWROOT_LIB_ZIP}" --directory="${MODULE_WWWROOT_LIB_DIR}"; \
        fi; \
      fi; \
    fi; \
    if [ -f "${MODULE_WWWROOT_DIR}/package.json" ] && [ ! -d "${MODULE_WWWROOT_DIR}/node_modules" ]; then \
      (cd "${MODULE_WWWROOT_DIR}" && npm install && gulp); \
    fi; \
    touch "${HANDSTACK_HOME}/.install.once"

RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

VOLUME ["/handstack"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
