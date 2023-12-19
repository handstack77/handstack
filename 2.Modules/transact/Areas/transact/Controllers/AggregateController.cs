using System;
using System.Data;
using System.Globalization;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class AggregateController : ControllerBase
    {
        private TransactLoggerClient loggerClient { get; }
        private Serilog.ILogger logger { get; }

        public AggregateController(Serilog.ILogger logger, TransactLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // http://localhost:8000/transact/api/aggregate/transaction-list?applicationID=HDS&year=2023&weekOfYear=39&resultType=L
        [HttpGet("[action]")]
        public ActionResult TransactionList(string applicationID, string year, string weekOfYear, string? requestDate, string? requestHour, string? resultType = "L")
        {
            ActionResult result = BadRequest();
            try
            {
                string rollingID = year + weekOfYear.PadLeft(2, '0');
                var isLogDbFile = ModuleExtensions.IsLogDbFile(applicationID, rollingID);
                if (isLogDbFile == true)
                {
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(applicationID, rollingID);
                    if (string.IsNullOrEmpty(connectionString) == false)
                    {
                        // resultType - L: List, V: Valid, E: Error
                        string featureID = resultType == "L" ? "LD01" : resultType == "V" ? "LD02" : "LD03";
                        var dsResult = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, connectionString, $"TAG.TAG010.{featureID}", new
                        {
                            CreateDate = requestDate.ToStringSafe(),
                            CreateHour = requestHour.ToStringSafe()
                        }) as DataSet;

                        if (dsResult != null && dsResult.Tables.Count > 0)
                        {
                            using DataTable dataTable = dsResult.Tables[0];
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

        // http://localhost:8000/transact/api/aggregate/summary?applicationID=HDS&year=2023&weekOfYear=39&requestDate=20230926
        [HttpGet("[action]")]
        public ActionResult Summary(string applicationID, string year, string weekOfYear, string requestDate)
        {
            ActionResult result = BadRequest();
            try
            {
                string rollingID = year + weekOfYear.PadLeft(2, '0');
                var isLogDbFile = ModuleExtensions.IsLogDbFile(applicationID, rollingID);
                if (isLogDbFile == true)
                {
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(applicationID, rollingID);
                    if (string.IsNullOrEmpty(connectionString) == false)
                    {
                        string format = "yyyyMMdd";
                        DateTime dtRequestDate;
                        if (DateTime.TryParseExact(requestDate, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out dtRequestDate))
                        {
                            CultureInfo cultureInfo = CultureInfo.InvariantCulture;
                            DayOfWeek dwFirst = cultureInfo.DateTimeFormat.FirstDayOfWeek;
                            DayOfWeek dwRequestDate = cultureInfo.Calendar.GetDayOfWeek(dtRequestDate);

                            int iDiff = dwRequestDate - dwFirst;
                            DateTime dtFirstDayOfWeek = dtRequestDate.AddDays(-iDiff + 1);
                            DateTime dtLastDayOfWeek = dtFirstDayOfWeek.AddDays(4);

                            var dsResult = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, connectionString, "TAG.TAG010.GD01", new
                            {
                                RequestDate = requestDate,
                                FirstDateOfWeek = dtFirstDayOfWeek.ToString("yyyyMMdd"),
                                LastDateOfWeek = dtLastDayOfWeek.ToString("yyyyMMdd")
                            }) as DataSet;

                            if (dsResult != null && dsResult.Tables.Count > 0)
                            {
                                using DataTable dataTable = dsResult.Tables[0];
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
    }
}
