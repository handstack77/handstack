@echo off
:: call pm2 stop ack
:: :: dotnet msbuild C:/projects/handstack/2.Modules/wwwroot/wwwroot.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy wwwroot C:/home/handstack/modules/wwwroot/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP