@echo off
:: call pm2 stop ack
dotnet msbuild %HANDSTACK_SRC%/2.Modules/repository/repository.csproj
robocopy bin/Debug/net10.0 %HANDSTACK_HOME%/modules/repository /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack