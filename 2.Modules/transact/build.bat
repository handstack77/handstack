@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/transact/transact.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/transact /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy transact C:/home/handstack/modules/transact/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP