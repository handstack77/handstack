FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["1.WebHost/deploy/deploy.csproj", "1.WebHost/deploy/"]

RUN dotnet restore "1.WebHost/deploy/deploy.csproj"

COPY ["1.WebHost/deploy/", "1.WebHost/deploy/"]

WORKDIR /src/1.WebHost/deploy
RUN dotnet publish "deploy.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:8520
EXPOSE 8520

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "deploy.dll"]
