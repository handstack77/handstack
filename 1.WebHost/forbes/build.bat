@echo off
:: call pm2 stop ack
:: dotnet msbuild forbes.csproj
:: robocopy bin/Debug/net10.0/wwwroot C:/home/handstack/forbes /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack