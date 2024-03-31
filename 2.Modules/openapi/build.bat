@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/openapi/openapi.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/openapi /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy openapi C:/home/handstack/modules/openapi/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP