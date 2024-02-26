@echo off
:: call pm2 stop ack
dotnet msbuild C:/projects/handstack77/handstack/1.WebHost/forbes/forbes.csproj
robocopy bin/Debug/net8.0/wwwroot C:/home/handstack/forbes /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack