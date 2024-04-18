@echo off

robocopy contracts #{ackHomePath}/contracts /e /copy:dat
robocopy wwwroot/checkman/view #{ackHomePath}/modules/wwwroot/wwwroot/view /e /copy:dat
