@echo off

:: robocopy Contracts ../../1.WebHost/build/handstack/contracts /e /copy:dat
:: robocopy wwwroot/view ../../1.WebHost/build/handstack/contracts/wwwroot /e /copy:dat
:: robocopy wwwroot ../../1.WebHost/build/handstack/modules/wwwroot/wwwroot /e /copy:dat /xd C:\projects\handstack77\handstack\2.Modules\wwwroot\wwwroot\lib

:: call pm2 stop ack
:: :: dotnet msbuild C:/projects/handstack/2.Modules/wwwroot/wwwroot.csproj
:: robocopy bin/Debug/net8.0 C:/home/handstack/modules/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy wwwroot C:/home/handstack/modules/wwwroot/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP