@echo off
:: call pm2 stop ack
dotnet msbuild C:\projects\handstack\handstack.sln -t:rebuild
:: pm2 restart ack