using System;
using System.Data;
using System.Globalization;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web.Common;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using transact.Entity;
using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class AggregateController : BaseController
    {
        private TransactLoggerClient loggerClient { get; }
        private Serilog.ILogger logger { get; }

        public AggregateController(Serilog.ILogger logger, TransactLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // http://localhost:8421/transact/api/aggregate/transaction-list?applicationID=HDS&year=2023&weekOfYear=39&resultType=L
        [HttpGet("[action]")]
        public ActionResult TransactionList(string userWorkID, string applicationID, string year, string weekOfYear, string? requestDate, string? requestHour, string? resultType = "L")
        {
            ActionResult result = BadRequest();
            try
            {
                var rollingID = ResolveRollingID(year, weekOfYear);
                var isLogDbFile = ModuleExtensions.IsLogDbFile(userWorkID, applicationID, rollingID);
                if (isLogDbFile == true)
                {
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID, rollingID);
                    if (!string.IsNullOrWhiteSpace(connectionString))
                    {
                        // resultType - L: List, V: Valid, E: Error
                        var featureID = resultType == "L" ? "LD01" : resultType == "V" ? "LD02" : "LD03";
                        var dsResult = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, connectionString, $"TAG.TAG010.{featureID}", new
                        {
                            CreateDate = requestDate.ToStringSafe(),
                            CreateHour = requestHour.ToStringSafe()
                        }) as DataSet;

                        if (dsResult != null && dsResult.Tables.Count > 0)
                        {
                            using var dataTable = dsResult.Tables[0];
                            result = Content(JsonConvert.SerializeObject(dataTable), "application/json");
                        }
                        else
                        {
                            result = Content("[]", "application/json");
                        }
                    }
                }
                else
                {
                    result = Content("[]", "application/json");
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"applicationID: {applicationID}, year: {year}, weekOfYear: {weekOfYear}", "AggregateController/ValidTransactionList");
            }

            return result;
        }

        // http://localhost:8421/transact/api/aggregate/summary?applicationID=HDS&year=2023&weekOfYear=39&requestDate=20230926
        [HttpGet("[action]")]
        public ActionResult Summary(string userWorkID, string applicationID, string year, string weekOfYear, string requestDate)
        {
            ActionResult result = BadRequest();
            try
            {
                var rollingID = ResolveRollingID(year, weekOfYear);
                var isLogDbFile = ModuleExtensions.IsLogDbFile(userWorkID, applicationID, rollingID);
                if (isLogDbFile == true)
                {
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID, rollingID);
                    if (!string.IsNullOrWhiteSpace(connectionString))
                    {
                        var format = "yyyyMMdd";
                        DateTime dtRequestDate;
                        if (DateTime.TryParseExact(requestDate, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out dtRequestDate))
                        {
                            var cultureInfo = CultureInfo.InvariantCulture;
                            var dwFirst = cultureInfo.DateTimeFormat.FirstDayOfWeek;
                            var dwRequestDate = cultureInfo.Calendar.GetDayOfWeek(dtRequestDate);

                            var iDiff = dwRequestDate - dwFirst;
                            var dtFirstDayOfWeek = dtRequestDate.AddDays(-iDiff + 1);
                            var dtLastDayOfWeek = dtFirstDayOfWeek.AddDays(4);

                            var dsResult = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, connectionString, "TAG.TAG010.GD01", new
                            {
                                RequestDate = requestDate,
                                FirstDateOfWeek = dtFirstDayOfWeek.ToString("yyyyMMdd"),
                                LastDateOfWeek = dtLastDayOfWeek.ToString("yyyyMMdd")
                            }) as DataSet;

                            if (dsResult != null && dsResult.Tables.Count > 0)
                            {
                                using var dataTable = dsResult.Tables[0];
                                result = Content(JsonConvert.SerializeObject(dataTable), "application/json");
                            }
                            else
                            {
                                result = Content("[{DateType:\"TODAY\",RequestCount:0,ResponseCount:0,ErrorCount:0},{DateType:\"WEEK\",RequestCount:0,ResponseCount:0,ErrorCount:0}]", "application/json");
                            }
                        }
                    }
                }
                else
                {
                    result = Content("[{DateType:\"TODAY\",RequestCount:0,ResponseCount:0,ErrorCount:0},{DateType:\"WEEK\",RequestCount:0,ResponseCount:0,ErrorCount:0}]", "application/json");
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"applicationID: {applicationID}, year: {year}, weekOfYear: {weekOfYear}", "AggregateController/ValidTransactionList");
            }

            return result;
        }

        // http://localhost:8421/transact/api/aggregate-metric?applicationID=HDS&year=2023&weekOfYear=39
        [HttpGet]
        public ActionResult AggregateMetric(string userWorkID, string applicationID, string? year, string? weekOfYear, long? lastMovedId, int? takeCount = 1000)
        {
            ActionResult result = BadRequest();
            try
            {
                var rollingID = ResolveRollingID(year, weekOfYear);
                var isLogDbFile = ModuleExtensions.IsLogDbFile(userWorkID, applicationID, rollingID);
                if (isLogDbFile == true)
                {
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID, rollingID);
                    if (!string.IsNullOrWhiteSpace(connectionString))
                    {
                        var requestTakeCount = takeCount.GetValueOrDefault(1000);
                        requestTakeCount = requestTakeCount < 1 ? 1 : requestTakeCount > 10000 ? 10000 : requestTakeCount;

                        var currentLastMovedId = lastMovedId ?? GetLastMovedId(connectionString);
                        if (currentLastMovedId < 0)
                        {
                            currentLastMovedId = 0;
                        }

                        var dsResult = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, connectionString, "TAG.TAG010.LD04", new
                        {
                            LastMovedId = currentLastMovedId,
                            TakeCount = requestTakeCount
                        }) as DataSet;

                        if (dsResult != null && dsResult.Tables.Count > 0)
                        {
                            using var dataTable = dsResult.Tables[0];
                            var response = new
                            {
                                LastMovedId = currentLastMovedId,
                                Count = dataTable.Rows.Count,
                                Rows = dataTable
                            };
                            result = Content(JsonConvert.SerializeObject(response), "application/json");
                        }
                        else
                        {
                            result = Content(JsonConvert.SerializeObject(new
                            {
                                LastMovedId = currentLastMovedId,
                                Count = 0,
                                Rows = Array.Empty<object>()
                            }), "application/json");
                        }
                    }
                }
                else
                {
                    result = Content(JsonConvert.SerializeObject(new
                    {
                        LastMovedId = 0,
                        Count = 0,
                        Rows = Array.Empty<object>()
                    }), "application/json");
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"applicationID: {applicationID}, year: {year}, weekOfYear: {weekOfYear}", "AggregateController/Aggregate");
            }

            return result;
        }

        // http://localhost:8421/transact/api/aggregate/last-moved-id?applicationID=HDS&year=2023&weekOfYear=39
        [HttpGet("last-moved-id")]
        public ActionResult LastMovedId(string userWorkID, string applicationID, string? year, string? weekOfYear)
        {
            ActionResult result = BadRequest();
            try
            {
                var rollingID = ResolveRollingID(year, weekOfYear);
                var isLogDbFile = ModuleExtensions.IsLogDbFile(userWorkID, applicationID, rollingID);
                if (isLogDbFile == true)
                {
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID, rollingID);
                    if (!string.IsNullOrWhiteSpace(connectionString))
                    {
                        var currentLastMovedId = GetLastMovedId(connectionString);
                        result = Content(JsonConvert.SerializeObject(new
                        {
                            LastMovedId = currentLastMovedId
                        }), "application/json");
                    }
                }
                else
                {
                    result = Content("{\"LastMovedId\":0}", "application/json");
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"applicationID: {applicationID}, year: {year}, weekOfYear: {weekOfYear}", "AggregateController/LastMovedId");
            }

            return result;
        }

        // http://localhost:8421/transact/api/aggregate/last-moved-id
        [HttpPost("last-moved-id")]
        public ActionResult UpdateLastMovedId([FromBody] LastMovedIdRequest request)
        {
            ActionResult result = BadRequest();
            if (request.LastMovedId < 0 || string.IsNullOrWhiteSpace(request.UserWorkID) || string.IsNullOrWhiteSpace(request.ApplicationID))
            {
                return result;
            }

            try
            {
                var rollingID = ResolveRollingID(request.Year, request.WeekOfYear);
                var connectionString = ModuleExtensions.GetLogDbConnectionString(request.UserWorkID, request.ApplicationID, rollingID);
                if (!string.IsNullOrWhiteSpace(connectionString))
                {
                    if (request.LastMovedId > 0)
                    {
                        ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.UD03", new
                        {
                            LastMovedId = request.LastMovedId
                        });
                    }

                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.UD04", new
                    {
                        LastMovedId = request.LastMovedId
                    });

                    var currentLastMovedId = GetLastMovedId(connectionString);
                    result = Content(JsonConvert.SerializeObject(new
                    {
                        LastMovedId = currentLastMovedId
                    }), "application/json");
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"applicationID: {request.ApplicationID}, year: {request.Year}, weekOfYear: {request.WeekOfYear}, lastMovedId: {request.LastMovedId}", "AggregateController/UpdateLastMovedId");
            }

            return result;
        }

        private static string ResolveRollingID(string? year, string? weekOfYear)
        {
            if (ModuleConfiguration.IsTransactAggregateRolling == false)
            {
                return "";
            }

            if (string.IsNullOrWhiteSpace(year) || string.IsNullOrWhiteSpace(weekOfYear))
            {
                return "";
            }

            return year + weekOfYear.PadLeft(2, '0');
        }

        private static long GetLastMovedId(string connectionString)
        {
            var scalar = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, connectionString, "TAG.TAG010.LD05");
            if (scalar == null)
            {
                return 0;
            }

            return long.TryParse(scalar.ToStringSafe(), out long parsedLastMovedId) ? parsedLastMovedId : 0;
        }
    }

    public class LastMovedIdRequest
    {
        public string UserWorkID { get; set; } = "";

        public string ApplicationID { get; set; } = "";

        public string? Year { get; set; }

        public string? WeekOfYear { get; set; }

        public long LastMovedId { get; set; }
    }
}

