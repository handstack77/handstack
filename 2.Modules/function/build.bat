@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/function/function.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/function /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy function C:/home/handstack/modules/function/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP