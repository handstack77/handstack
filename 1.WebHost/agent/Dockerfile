FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["1.WebHost/agent/agent.csproj", "1.WebHost/agent/"]
COPY ["3.Infrastructure/Assemblies/Release/", "3.Infrastructure/Assemblies/Release/"]

RUN dotnet restore "1.WebHost/agent/agent.csproj"

COPY ["1.WebHost/agent/", "1.WebHost/agent/"]

WORKDIR /src/1.WebHost/agent
RUN dotnet publish "agent.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:8422
EXPOSE 8422

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "agent.dll"]
