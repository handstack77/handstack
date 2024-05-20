@echo off
:: call pm2 stop ack
:: dotnet msbuild C:/projects/handstack/2.Modules/prompter/prompter.csproj
robocopy bin/Debug/net8.0 C:/home/handstack/modules/prompter /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy prompter C:/home/handstack/modules/prompter/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP