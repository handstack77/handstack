@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/dbclient/dbclient.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/dbclient /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy dbclient C:/home/handstack/modules/dbclient/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP