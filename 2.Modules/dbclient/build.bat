@echo off
:: call pm2 stop ack
dotnet msbuild %HANDSTACK_SRC%/2.Modules/dbclient/dbclient.csproj
robocopy bin/Debug/net10.0 %HANDSTACK_HOME%/modules/dbclient /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack