using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using logger.Encapsulation;
using logger.Entity;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace logger.Areas.logger.Controllers
{
    [Area("logger")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class LogController : BaseController
    {
        private static readonly Dictionary<string, PropertyInfo> LogMessageProperties = typeof(LogMessage)
            .GetProperties(BindingFlags.Instance | BindingFlags.Public)
            .ToDictionary(property => property.Name, property => property, StringComparer.OrdinalIgnoreCase);

        private static readonly HashSet<string> LogMessagePropertyNames = CreateLogMessagePropertyNames();

        private ILogger logger { get; }

        private ILoggerClient loggerClient { get; }

        public LogController(ILogger logger, ILoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // logMessage.ServerID = "WEB01";
        // logMessage.RunningEnvironment = "D";
        // logMessage.ProgramName = "HANDSTACK";
        // logMessage.GlobalID = "HDSSYSSYS010LF01D20230918131830863LFK";
        // logMessage.Acknowledge = "1";
        // logMessage.ApplicationID = "HDS";
        // logMessage.ProjectID = "SYS";
        // logMessage.TransactionID = "SYS010";
        // logMessage.ServiceID = "LF01";
        // logMessage.Type = "T";
        // logMessage.Flow = "I";
        // logMessage.Level = "D";
        // logMessage.Format = "J";
        // logMessage.Message = "블라블라";
        // logMessage.Properties = "프롭프롭";
        // logMessage.UserID = "system";
        // logMessage.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        // logMessage.IpAddress = "system";
        // logMessage.DeviceID = "system";
        // logMessage.ProgramID = "system";
        // http://localhost:8421/logger/api/log/insert
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public async Task<ActionResult> Insert()
        {
            ActionResult result = BadRequest();

            try
            {
                var insertRequest = await ReadInsertRequest();
                var logMessage = insertRequest.LogMessage;

                if (string.IsNullOrWhiteSpace(logMessage.ApplicationID))
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(logMessage));
                    return result;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(logMessage.ApplicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(logMessage));
                        return result;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(logMessage.ApplicationID) == false)
                {
                    logger.Warning($"ApplicationID: {logMessage.ApplicationID} 데이터 소스 확인 필요: " + JsonConvert.SerializeObject(logMessage));
                    return result;
                }

                var dataSource = ModuleConfiguration.DataSource.Find(p => p.ApplicationID == logMessage.ApplicationID);
                var isInserted = await loggerClient.InsertWithPolicy(logMessage, insertRequest.ExtraPayload);
                if (dataSource?.HasDynamicSchema() == true && isInserted == false)
                {
                    return result;
                }

                result = Ok();
            }
            catch (DynamicLogValidationException exception)
            {
                logger.Warning("[{LogCategory}] " + exception.Message, "LogController/Insert");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LogController/Insert");
            }

            return result;
        }

        private async Task<(LogMessage LogMessage, IReadOnlyDictionary<string, object?> ExtraPayload)> ReadInsertRequest()
        {
            if (HttpMethods.IsPost(Request.Method) == true && IsJsonContentType(Request.ContentType) == true)
            {
                using var reader = new StreamReader(Request.Body);
                var content = await reader.ReadToEndAsync();
                if (string.IsNullOrWhiteSpace(content) == true)
                {
                    return (new LogMessage(), new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase));
                }

                var payload = JObject.Parse(content);
                var logMessage = payload.ToObject<LogMessage>() ?? new LogMessage();
                return (logMessage, ExtractExtraPayload(payload));
            }

            var request = new LogMessage();
            ApplyLogMessageValues(request, Request.Query);

            if (HttpMethods.IsPost(Request.Method) == true && Request.HasFormContentType == true)
            {
                var form = await Request.ReadFormAsync();
                ApplyLogMessageValues(request, form);
            }

            return (request, new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase));
        }

        private static bool IsJsonContentType(string? contentType)
        {
            return string.IsNullOrWhiteSpace(contentType) == false &&
                contentType.IndexOf("application/json", StringComparison.OrdinalIgnoreCase) > -1;
        }

        private static void ApplyLogMessageValues(LogMessage logMessage, IEnumerable<KeyValuePair<string, StringValues>> values)
        {
            foreach (var item in values)
            {
                if (LogMessageProperties.TryGetValue(item.Key, out var property) == false)
                {
                    continue;
                }

                var value = item.Value.ToString();
                if (property.PropertyType == typeof(long))
                {
                    if (long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var longValue) == true)
                    {
                        property.SetValue(logMessage, longValue);
                    }
                }
                else
                {
                    property.SetValue(logMessage, value);
                }
            }
        }

        private static IReadOnlyDictionary<string, object?> ExtractExtraPayload(JObject payload)
        {
            var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in payload.Properties())
            {
                if (LogMessagePropertyNames.Contains(property.Name) == true)
                {
                    continue;
                }

                result[property.Name] = ConvertPayloadToken(property.Value);
            }

            return result;
        }

        private static object? ConvertPayloadToken(JToken token)
        {
            return token.Type switch
            {
                JTokenType.Null => null,
                JTokenType.Object or JTokenType.Array => token.ToString(Formatting.None),
                _ => token is JValue value ? value.Value : token.ToString(Formatting.None)
            };
        }

        private static HashSet<string> CreateLogMessagePropertyNames()
        {
            var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in LogMessageProperties.Values)
            {
                result.Add(property.Name);
                var jsonProperty = property.GetCustomAttribute<JsonPropertyAttribute>();
                if (string.IsNullOrWhiteSpace(jsonProperty?.PropertyName) == false)
                {
                    result.Add(jsonProperty.PropertyName);
                }
            }

            return result;
        }

        // http://localhost:8421/logger/api/log/list?applicationID=HDS
        [HttpGet("[action]")]
        public async Task<ActionResult> List(string applicationID, string? serverID, string? globalID, string? environment, string? projectID, string? serviceID, string? transactionID, string? startedAt, string? endedAt)
        {
            ActionResult result = BadRequest();

            try
            {
                if (string.IsNullOrWhiteSpace(applicationID))
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                    {
                        ApplicationID = applicationID,
                        ServerID = serverID,
                        GlobalID = globalID,
                        Environment = environment,
                        ProjectID = projectID,
                        ServiceID = serviceID,
                        TransactionID = transactionID,
                        StartedAt = startedAt,
                        EndedAt = endedAt
                    }));
                    return result;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(applicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(new
                        {
                            ApplicationID = applicationID,
                            ServerID = serverID,
                            GlobalID = globalID,
                            Environment = environment,
                            ProjectID = projectID,
                            ServiceID = serviceID,
                            TransactionID = transactionID,
                            StartedAt = startedAt,
                            EndedAt = endedAt
                        }));
                        return result;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(applicationID) == false)
                {
                    logger.Warning($"ApplicationID: {applicationID} 데이터 소스 확인 필요");
                    return result;
                }

                using var dataSet = await loggerClient.LogList(applicationID, serverID, globalID, environment, projectID, serviceID, transactionID, startedAt, endedAt);
                result = Content(dataSet == null ? "[]" : JsonConvert.SerializeObject(dataSet.Tables[0]), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LogController/List");
            }

            return result;
        }

        // http://localhost:8421/logger/api/log/detail?applicationID=HDS&logNo=1
        [HttpGet("[action]")]
        public async Task<ActionResult> Detail(string applicationID, string logNo)
        {
            ActionResult result = BadRequest();

            try
            {
                if (string.IsNullOrWhiteSpace(applicationID) || string.IsNullOrWhiteSpace(logNo))
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                    {
                        ApplicationID = applicationID,
                        LogNo = logNo
                    }));
                    return result;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(applicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(new
                        {
                            ApplicationID = applicationID,
                            LogNo = logNo
                        }));
                        return result;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(applicationID) == false)
                {
                    logger.Warning($"ApplicationID: {applicationID} 데이터 소스 확인 필요");
                    return result;
                }

                using var dataSet = await loggerClient.LogDetail(applicationID, logNo);
                result = Content(dataSet == null ? "[]" : JsonConvert.SerializeObject(dataSet.Tables[0]), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LogController/Detail");
            }

            return result;
        }
    }
}
