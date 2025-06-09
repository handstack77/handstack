@echo off

:: robocopy Contracts %HANDSTACK_SRC%/../build/handstack/contracts /e /copy:dat
:: robocopy wwwroot/view %HANDSTACK_SRC%/../build/handstack/contracts/wwwroot /e /copy:dat
:: robocopy wwwroot %HANDSTACK_SRC%/../build/handstack/modules/wwwroot/wwwroot /e /copy:dat /xd C:\projects\handstack77\handstack\2.Modules\wwwroot\wwwroot\lib

:: call pm2 stop ack
:: :: dotnet msbuild C:/projects/handstack/2.Modules/wwwroot/wwwroot.csproj
:: robocopy bin/Debug/net8.0 C:/home/handstack/modules/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: robocopy wwwroot C:/home/handstack/modules/wwwroot/wwwroot /MIR /NFL /NDL /NJH /NJS /NC /NS /NP