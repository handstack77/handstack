@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/repository/repository.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/repository /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy repository C:/home/handstack/modules/repository/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP