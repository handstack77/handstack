@echo off
:: call pm2 stop ack
dotnet msbuild %HANDSTACK_SRC%/2.Modules/wwwroot/wwwroot.csproj
robocopy Contracts %HANDSTACK_HOME%/contracts /e /copy:dat
robocopy wwwroot/view %HANDSTACK_HOME%/contracts/wwwroot /e /copy:dat
:: pm2 restart ack
