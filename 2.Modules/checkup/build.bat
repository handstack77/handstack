@echo off

robocopy Contracts ../1.WebHost/build/handstack/contracts /e /copy:dat
robocopy wwwroot ../1.WebHost/build/handstack/modules/checkup/wwwroot /e /copy:dat
:: robocopy wwwroot/checkup/view ../1.WebHost/build/handstack/modules/checkup/wwwroot/checkup/view /e /copy:dat

:: pm2 start ../1.WebHost/build/handstack/app/ack.exe
:: call pm2 stop ack
:: cd C:\home\ack\app\ack
:: call pm2 restart ack
:: call pm2 start ack.exe --name ack

::::::::::::::::: 명령어 템플릿 :::::::::::::::::
:: pm2 start ack
:: pm2 stop ack
:: pm2 monit ack
:: dotnet msbuild checkup.csproj
:: robocopy bin\Debug\net8.0 C:\home\ack\modules\checkup /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: wwwroot 파일 복사
:: <Target Name="PostBuild" AfterTargets="PostBuildEvent">
::	   <Exec Command="$(SolutionDir)\checkup\build.bat" />
::     <Exec Command="(robocopy $(SolutionDir)\checkup\bin\Debug\net8.0 C:\home\ack\modules\checkup /S /E /COPY:DAT /PURGE) ^&amp; IF %25ERRORLEVEL%25 LEQ 1 exit 0" />
:: </Target>