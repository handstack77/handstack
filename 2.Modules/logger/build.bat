@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/logger/logger.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/logger /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy logger C:/home/handstack/modules/logger/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP