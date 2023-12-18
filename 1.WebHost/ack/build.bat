@echo off
:: call pm2 stop ack
dotnet msbuild C:/projects/handstack/1.WebHost/ack/ack.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/app /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack