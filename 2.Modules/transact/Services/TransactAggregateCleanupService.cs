using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Data.Enumeration;

using Microsoft.Extensions.Hosting;

using transact.Entity;
using transact.Extensions;

namespace transact.Services
{
    internal class TransactAggregateCleanupService : BackgroundService
    {
        private const string DefaultCronExpression = "0 1 * * *";

        private readonly Serilog.ILogger logger;

        private DateTime lastRunMinute = DateTime.MinValue;

        private string lastWarnedInvalidCronExpression = string.Empty;

        public TransactAggregateCleanupService(Serilog.ILogger logger)
        {
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (stoppingToken.IsCancellationRequested == false)
            {
                try
                {
                    if (ModuleConfiguration.IsTransactAggregate == true && ModuleConfiguration.IsTransactAggregateRolling == false)
                    {
                        var now = DateTime.Now;
                        var currentMinute = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute, 0);
                        if (currentMinute != lastRunMinute && IsCronMatched(now))
                        {
                            DeleteOldMovedRows(now, stoppingToken);
                            lastRunMinute = currentMinute;
                        }
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] moved 집계 데이터 삭제 오류", "TransactAggregateCleanupService/ExecuteAsync");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                }
            }
        }

        private bool IsCronMatched(DateTime now)
        {
            var cronExpression = string.IsNullOrWhiteSpace(ModuleConfiguration.TransactAggregateDeleteOldCronTime) ? DefaultCronExpression : ModuleConfiguration.TransactAggregateDeleteOldCronTime.Trim();
            if (SimpleCronExpression.IsValid(cronExpression) == false)
            {
                if (string.Equals(lastWarnedInvalidCronExpression, cronExpression, StringComparison.Ordinal) == false)
                {
                    logger.Warning("[{LogCategory}] TransactAggregateDeleteOldCronTime 확인 필요, 기본값으로 처리: " + cronExpression, "TransactAggregateCleanupService/IsCronMatched");
                    lastWarnedInvalidCronExpression = cronExpression;
                }

                cronExpression = DefaultCronExpression;
            }

            return SimpleCronExpression.IsMatch(cronExpression, now);
        }

        private void DeleteOldMovedRows(DateTime now, CancellationToken stoppingToken)
        {
            var transactionAggregateBasePath = ModuleConfiguration.TransactionAggregateBasePath;
            if (string.IsNullOrWhiteSpace(transactionAggregateBasePath) || Directory.Exists(transactionAggregateBasePath) == false)
            {
                return;
            }

            var deleteBeforeDate = int.Parse(now.ToString("yyyyMMdd"));
            var deleteCount = 0;
            var targetCount = 0;

            foreach (var userWorkPath in Directory.GetDirectories(transactionAggregateBasePath))
            {
                if (stoppingToken.IsCancellationRequested == true)
                {
                    break;
                }

                var userWorkID = Path.GetFileName(userWorkPath);
                if (string.IsNullOrWhiteSpace(userWorkID))
                {
                    continue;
                }

                foreach (var applicationPath in Directory.GetDirectories(userWorkPath))
                {
                    if (stoppingToken.IsCancellationRequested == true)
                    {
                        break;
                    }

                    var applicationID = Path.GetFileName(applicationPath);
                    if (string.IsNullOrWhiteSpace(applicationID))
                    {
                        continue;
                    }

                    var dbFilePath = Path.Combine(applicationPath, $"{applicationID}.db");
                    if (File.Exists(dbFilePath) == false)
                    {
                        continue;
                    }

                    targetCount++;
                    try
                    {
                        var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID);
                        if (string.IsNullOrWhiteSpace(connectionString))
                        {
                            continue;
                        }

                        var lastMovedId = GetLastMovedId(connectionString);
                        if (lastMovedId <= 0)
                        {
                            continue;
                        }

                        var result = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.DD01", new
                        {
                            LastMovedId = lastMovedId,
                            DeleteBeforeDate = deleteBeforeDate
                        });

                        var resultText = result?.ToString();
                        if (int.TryParse(resultText, out int deletedRows) == true)
                        {
                            deleteCount += deletedRows;
                        }
                    }
                    catch (Exception exception)
                    {
                        logger.Error(exception, "[{LogCategory}] moved 집계 데이터 삭제 오류 " + $"userWorkID: {userWorkID}, applicationID: {applicationID}", "TransactAggregateCleanupService/DeleteOldMovedRows");
                    }
                }
            }

            logger.Information("[{LogCategory}] moved 집계 데이터 삭제 완료 " + $"targetCount: {targetCount}, deleteCount: {deleteCount}, deleteBeforeDate: {deleteBeforeDate}", "TransactAggregateCleanupService/DeleteOldMovedRows");
        }

        private static long GetLastMovedId(string connectionString)
        {
            var scalar = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, connectionString, "TAG.TAG010.LD05");
            if (scalar == null)
            {
                return 0;
            }

            return long.TryParse(scalar?.ToString(), out long lastMovedId) ? lastMovedId : 0;
        }
    }

    internal static class SimpleCronExpression
    {
        public static bool IsValid(string expression)
        {
            return TryParse(expression, out _);
        }

        public static bool IsMatch(string expression, DateTime value)
        {
            if (TryParse(expression, out var fields) == false || fields == null)
            {
                return false;
            }

            return IsFieldMatched(fields[0], value.Minute, 0, 59, false)
                && IsFieldMatched(fields[1], value.Hour, 0, 23, false)
                && IsFieldMatched(fields[2], value.Day, 1, 31, false)
                && IsFieldMatched(fields[3], value.Month, 1, 12, false)
                && IsFieldMatched(fields[4], (int)value.DayOfWeek, 0, 7, true);
        }

        private static bool TryParse(string expression, out string[]? fields)
        {
            fields = null;
            if (string.IsNullOrWhiteSpace(expression))
            {
                return false;
            }

            var items = expression.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (items.Length != 5)
            {
                return false;
            }

            if (IsFieldValid(items[0], 0, 59, false) == false
                || IsFieldValid(items[1], 0, 23, false) == false
                || IsFieldValid(items[2], 1, 31, false) == false
                || IsFieldValid(items[3], 1, 12, false) == false
                || IsFieldValid(items[4], 0, 7, true) == false)
            {
                return false;
            }

            fields = items;
            return true;
        }

        private static bool IsFieldValid(string field, int minimum, int maximum, bool allowDayOfWeekSundaySeven)
        {
            foreach (var token in field.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                if (TryParseToken(token, minimum, maximum, allowDayOfWeekSundaySeven, out _, out _, out _) == false)
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsFieldMatched(string field, int value, int minimum, int maximum, bool allowDayOfWeekSundaySeven)
        {
            foreach (var token in field.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                if (TryParseToken(token, minimum, maximum, allowDayOfWeekSundaySeven, out var start, out var end, out var step) == true)
                {
                    if (value >= start && value <= end && (value - start) % step == 0)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private static bool TryParseToken(string token, int minimum, int maximum, bool allowDayOfWeekSundaySeven, out int start, out int end, out int step)
        {
            start = 0;
            end = 0;
            step = 1;

            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            var valueToken = token.Trim();
            var stepToken = valueToken.Split('/');
            if (stepToken.Length > 2)
            {
                return false;
            }

            if (stepToken.Length == 2)
            {
                valueToken = stepToken[0];
                if (int.TryParse(stepToken[1], out step) == false || step <= 0)
                {
                    return false;
                }
            }

            if (valueToken == "*")
            {
                start = minimum;
                end = maximum;
                return true;
            }

            var rangeToken = valueToken.Split('-');
            if (rangeToken.Length == 1)
            {
                if (TryParseValue(rangeToken[0], minimum, maximum, allowDayOfWeekSundaySeven, out var singleValue) == false)
                {
                    return false;
                }

                start = singleValue;
                end = singleValue;
                return true;
            }

            if (rangeToken.Length == 2)
            {
                if (TryParseValue(rangeToken[0], minimum, maximum, allowDayOfWeekSundaySeven, out start) == false
                    || TryParseValue(rangeToken[1], minimum, maximum, allowDayOfWeekSundaySeven, out end) == false)
                {
                    return false;
                }

                return end >= start;
            }

            return false;
        }

        private static bool TryParseValue(string token, int minimum, int maximum, bool allowDayOfWeekSundaySeven, out int value)
        {
            value = 0;
            if (int.TryParse(token, out value) == false)
            {
                return false;
            }

            if (allowDayOfWeekSundaySeven == true && value == 7)
            {
                value = 0;
            }

            return value >= minimum && value <= maximum;
        }
    }
}


