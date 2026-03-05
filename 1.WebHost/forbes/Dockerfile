FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["1.WebHost/forbes/forbes.csproj", "1.WebHost/forbes/"]
COPY ["3.Infrastructure/Assemblies/Release/", "3.Infrastructure/Assemblies/Release/"]

RUN dotnet restore "1.WebHost/forbes/forbes.csproj"

COPY ["1.WebHost/forbes/", "1.WebHost/forbes/"]

WORKDIR /src/1.WebHost/forbes
RUN dotnet publish "forbes.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:8420
ENV HANDSTACK_HOME=/app

EXPOSE 8420

COPY --from=build /app/publish .

VOLUME ["/app/Contracts"]

ENTRYPOINT ["dotnet", "forbes.dll"]
