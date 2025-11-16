@echo off

robocopy Contracts %HANDSTACK_HOME%/contracts /e /copy:dat
robocopy wwwroot %HANDSTACK_HOME%/modules/checkup/wwwroot /e /copy:dat
:: robocopy wwwroot/checkup/view %HANDSTACK_HOME%/modules/checkup/wwwroot/checkup/view /e /copy:dat

:: pm2 start %HANDSTACK_HOME%/app/ack.exe
:: call pm2 stop ack
:: cd C:\home\ack\app\ack
:: call pm2 restart ack
:: call pm2 start ack.exe --name ack

::::::::::::::::: 명령어 템플릿 :::::::::::::::::
:: pm2 start ack
:: pm2 stop ack
:: pm2 monit ack
:: dotnet msbuild checkup.csproj
:: robocopy bin\Debug\net10.0 C:\home\ack\modules\checkup /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
:: pm2 restart ack

:: wwwroot 파일 복사
:: <Target Name="PostBuild" AfterTargets="PostBuildEvent">
::	   <Exec Command="$(SolutionDir)\checkup\build.bat" />
::     <Exec Command="(robocopy $(SolutionDir)\checkup\bin\Debug\net10.0 C:\home\ack\modules\checkup /S /E /COPY:DAT /PURGE) ^&amp; IF %25ERRORLEVEL%25 LEQ 1 exit 0" />
:: </Target>