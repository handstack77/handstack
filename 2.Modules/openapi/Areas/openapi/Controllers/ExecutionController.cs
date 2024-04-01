using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;

using Dapper;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Data;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Enumeration;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using openapi.Encapsulation;
using openapi.Entity;
using openapi.Extensions;

using Org.BouncyCastle.Asn1.Ocsp;

using Serilog;

namespace openapi.Areas.openapi.Controllers
{
    [Area("openapi")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ExecutionController : ControllerBase
    {
        private ILogger logger { get; }

        private IOpenAPIClient openapiClient { get; }

        public ExecutionController(ILogger logger, IOpenAPIClient openapiClient)
        {
            this.logger = logger;
            this.openapiClient = openapiClient;
        }

        // http://localhost:8000/openapi/api/execution/handsup-codes?AccessID=c48972d403cf4c3485d2625a892d135d&GroupCode=SYS000&CategoryID=
        [HttpGet("{interfaceID}")]
        public async Task<ActionResult> Main(string interfaceID)
        {
            ActionResult result = StatusCode(400, ResponseApi.I20.ToEnumString());

            Dictionary<string, object?> parameters = new Dictionary<string, object?>();
            try
            {
                foreach (var item in Request.Query)
                {
                    parameters.Add(item.Key, item.Value);
                }

                string? accessID = Request.Headers["AccessID"].ToStringSafe();
                if (parameters.ContainsKey("AccessID") == true)
                {
                    accessID = parameters["AccessID"].ToStringSafe();
                }

                if (string.IsNullOrEmpty(interfaceID) == true || string.IsNullOrEmpty(accessID) == true)
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                    {
                        InterfaceID = interfaceID,
                        AccessID = accessID
                    }));
                    return result;
                }

                var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), ModuleConfiguration.ModuleDataSource.DataProvider);
                string transactionID = string.Empty;
                switch (dataProvider)
                {
                    case DataProviders.SqlServer:
                        transactionID = "SQS010";
                        break;
                    case DataProviders.Oracle:
                        transactionID = "ORA010";
                        break;
                    case DataProviders.MySQL:
                        transactionID = "MYS010";
                        break;
                    case DataProviders.PostgreSQL:
                        transactionID = "PGS010";
                        break;
                    case DataProviders.SQLite:
                        transactionID = "SLT010";
                        break;
                }

                var apiService = ModuleConfiguration.ApiServices.FirstOrDefault(item =>
                    item.InterfaceID == interfaceID
                );

                if (apiService == null)
                {
                    apiService = ModuleExtensions.ExecuteMetaSQLPoco<ApiService>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD03", new
                    {
                        InterfaceID = interfaceID
                    });

                    if (apiService == null)
                    {
                        logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                        {
                            InterfaceID = interfaceID,
                            AccessID = accessID
                        }));
                        return result;
                    }
                    else
                    {
                        ModuleConfiguration.ApiServices.Add(apiService);
                    }
                }

                AccessMemberApi? accessMemberApi = null;
                var accessMemberApis = ModuleConfiguration.AccessMemberApis.GetValueOrDefault(apiService.APIServiceID);
                if (accessMemberApis == null)
                {
                    accessMemberApi = ModuleExtensions.ExecuteMetaSQLPoco<AccessMemberApi>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD05", new
                    {
                        APIServiceID = apiService.APIServiceID,
                        AccessID = accessID
                    });

                    if (accessMemberApi == null)
                    {
                        logger.Warning($"{ResponseApi.I20.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(400, ResponseApi.I20.ToEnumString());
                        return result;
                    }
                    else
                    {
                        accessMemberApi.AllowIPAddress = accessMemberApi.IPAddress.SplitComma();
                        ModuleConfiguration.AccessMemberApis.Add(apiService.APIServiceID, new List<AccessMemberApi>() { accessMemberApi });
                    }
                }
                else
                {
                    accessMemberApi = accessMemberApis.FirstOrDefault(item =>
                        item.AccessID == accessID
                    );

                    if (accessMemberApi == null)
                    {
                        accessMemberApi = ModuleExtensions.ExecuteMetaSQLPoco<AccessMemberApi>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD05", new
                        {
                            APIServiceID = apiService.APIServiceID,
                            AccessID = accessID
                        });

                        if (accessMemberApi == null)
                        {
                            logger.Warning($"{ResponseApi.I20.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                            result = StatusCode(400, ResponseApi.I20.ToEnumString());
                            return result;
                        }
                        else
                        {
                            accessMemberApis.Add(accessMemberApi);
                        }
                    }
                }

                var dataSource = ModuleConfiguration.ApiDataSource.FirstOrDefault(item =>
                    item.DataSourceID == apiService.DataSourceID
                );

                if (dataSource == null)
                {
                    dataSource = ModuleExtensions.ExecuteMetaSQLPoco<ApiDataSource>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD04", new { 
                        DataSourceID = apiService.DataSourceID
                    });

                    if (dataSource == null)
                    {
                        logger.Warning($"{ResponseApi.I24.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(400, ResponseApi.I24.ToEnumString());
                        return result;
                    }
                    else
                    {
                        if (dataSource.IsEncryption == true)
                        {
                            dataSource.ConnectionString = DatabaseMapper.DecryptConnectionString(dataSource.ConnectionString);
                        }

                        ModuleConfiguration.ApiDataSource.Add(dataSource);
                    }
                }

                var apiParameters = ModuleConfiguration.ApiParameters.GetValueOrDefault(apiService.APIServiceID);
                if (apiParameters == null)
                {
                    apiParameters = ModuleExtensions.ExecuteMetaSQLPocos<ApiParameter>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.LD01", new
                    {
                        APIServiceID = apiService.APIServiceID
                    });

                    if (apiParameters == null)
                    {
                        logger.Warning($"{ResponseApi.E99.ToEnumString()}: " + JsonConvert.SerializeObject(parameters) + $", HOA.{transactionID}.LD01");
                        result = StatusCode(500, ResponseApi.E99.ToEnumString() + $", HOA.{transactionID}.LD01");
                        return result;
                    }
                    else
                    {
                        ModuleConfiguration.ApiParameters.Add(apiService.APIServiceID, apiParameters);
                    }
                }

                foreach (var apiParameter in apiParameters)
                {
                    string parameterID = apiParameter.ParameterID.Replace("@", "").Replace("#", "").Replace(":", "");
                    var parameterValue = parameters[apiParameter.ParameterID];
                    if (parameterValue == null && apiParameter.RequiredYN == true)
                    {
                        logger.Warning($"{ResponseApi.I23.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(400, ResponseApi.I23.ToEnumString());
                        return result;
                    }

                    if (string.IsNullOrEmpty(parameterValue.ToStringSafe()) == true)
                    {
                        parameterValue = parameterValue == null && apiParameter.DefaultValue != "NULL" ? apiParameter.DefaultValue : null;
                    }

                    parameters[apiParameter.ParameterID] = parameterValue;
                }

                var executeResult = await openapiClient.ExecuteSQL(apiService, dataSource, accessMemberApi, apiParameters, parameters);
                if (string.IsNullOrEmpty(executeResult.Item1) == false)
                {
                    result = StatusCode(400, executeResult.Item1);
                }
                else
                {
                    using var dataSet = executeResult.Item2;
                    result = Content(dataSet == null ? "[]" : JsonConvert.SerializeObject(dataSet.Tables[0]), "application/json");
                }
            }
            catch (Exception exception)
            {
                result = StatusCode(500, "99: UNKNOWN_ERROR, 기타 에러");
                logger.Error(exception, "[{LogCategory}] " + $"parameters: {JsonConvert.SerializeObject(parameters)}", "ExecutionController/Main");
            }

            return result;
        }
    }
}
