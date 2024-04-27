using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Soap;
using System.ServiceModel.Syndication;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web.Entity;
using HandStack.Web.Enumeration;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

using Newtonsoft.Json;

using openapi.Encapsulation;
using openapi.Entity;
using openapi.Enumeration;
using openapi.Extensions;

using Serilog;

namespace openapi.Areas.openapi.Controllers
{
    [Area("openapi")]
    [Route("[area]")]
    [ApiController]
    [EnableCors]
    public class TransactionController : ControllerBase
    {
        private readonly ILogger logger;

        private readonly IOpenAPIClient openapiClient;

        private readonly IMemoryCache memoryCache;

        private readonly DataProviders dataProvider;

        public TransactionController(ILogger logger, IMemoryCache memoryCache, IOpenAPIClient openapiClient)
        {
            this.logger = logger;
            this.openapiClient = openapiClient;
            this.memoryCache = memoryCache;
            this.dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), ModuleConfiguration.ModuleDataSource.DataProvider);
        }

        // http://localhost:8000/openapi/api/transaction/remove-cache?apiServiceID=
        [HttpGet("api/transaction/[action]")]
        public ActionResult RemoveCache(string apiServiceID)
        {
            ActionResult result = BadRequest();
            try
            {
                if (string.IsNullOrEmpty(apiServiceID) == false)
                {
                    List<string> items = GetMemoryCacheKeys(apiServiceID);
                    foreach (string item in items)
                    {
                        memoryCache.Remove(item);
                    }
                }

                result = Ok();
            }
            catch (Exception exception)
            {
                string exceptionText = exception.ToMessage();
                logger.Warning("[{LogCategory}] " + exceptionText, "Transaction/CacheClear");
                result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
            }

            return result;
        }

        // http://localhost:8000/openapi/handsup-codes?AccessID=c48972d403cf4c3485d2625a892d135d&GroupCode=SYS000&CategoryID=
        [HttpGet("{interfaceID}")]
        public async Task<ActionResult> Execute(string interfaceID)
        {
            ActionResult result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I20.ToEnumString());

            Dictionary<string, object?> parameters = new Dictionary<string, object?>();
            try
            {
                string requestUrl = Request.GetAbsoluteUrl();
                foreach (var item in Request.Query)
                {
                    parameters.Add(item.Key, item.Value);
                }

                string accessID = Request.GetContainValue("AccessID");
                if (string.IsNullOrEmpty(interfaceID) == true || string.IsNullOrEmpty(accessID) == true)
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                    {
                        InterfaceID = interfaceID,
                        AccessID = accessID
                    }));
                    return result;
                }

                string transactionID = dataProvider.ToEnumString();
                var format = parameters.ContainsKey("Format") == true ? parameters["Format"].ToStringSafe().ToLower() : "json";
                var apiService = ModuleConfiguration.ApiServices.FirstOrDefault(item =>
                    item.InterfaceID == interfaceID
                );

                if (apiService == null)
                {
                    apiService = openapiClient.GetApiService(interfaceID);
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
                        if (apiService.FormatJsonYN == false && apiService.FormatXmlYN == false && apiService.FormatSoapYN == false && apiService.FormatRssYN == false && apiService.FormatAtomYN == false)
                        {
                            switch (format)
                            {
                                case "json":
                                    apiService.FormatJsonYN = true;
                                    break;
                                case "xml":
                                    apiService.FormatXmlYN = true;
                                    break;
                                case "soap":
                                    apiService.FormatSoapYN = true;
                                    break;
                                case "rss":
                                    apiService.FormatRssYN = true;
                                    break;
                                case "atom":
                                    apiService.FormatAtomYN = true;
                                    break;
                            }
                        }
                        ModuleConfiguration.ApiServices.Add(apiService);
                    }
                }

                switch (format)
                {
                    case "json":
                    case "xml":
                    case "soap":
                    case "rss":
                    case "atom":
                        break;
                    default:
                        format = apiService.DefaultFormat;
                        break;
                }

                AccessMemberApi? accessMemberApi = null;
                var accessMemberApis = ModuleConfiguration.AccessMemberApis.GetValueOrDefault(apiService.APIServiceID);
                if (accessMemberApis == null)
                {
                    accessMemberApi = openapiClient.GetAccessMemberApi(apiService.APIServiceID, accessID);
                    if (accessMemberApi == null)
                    {
                        logger.Warning($"{ResponseApi.I20.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I20.ToEnumString());
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
                        accessMemberApi = openapiClient.GetAccessMemberApi(apiService.APIServiceID, accessID);
                        if (accessMemberApi == null)
                        {
                            logger.Warning($"{ResponseApi.I20.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                            result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I20.ToEnumString());
                            return result;
                        }
                        else
                        {
                            accessMemberApis.Add(accessMemberApi);
                        }
                    }
                }

                string remoteClientIP = HttpContext.GetRemoteIpAddress().ToStringSafe();
                if (apiService.LimitIPAddressYN == true && accessMemberApi.AllowIPAddress.Contains(remoteClientIP) == false)
                {
                    logger.Warning($"{ResponseApi.I42.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                    result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I42.ToEnumString());
                    return result;
                }

                if (apiService.AccessControl == "SecretKey")
                {
                    string secretKey = Request.GetContainValue("SecretKey");
                    if (accessMemberApi.SecretKey != secretKey)
                    {
                        logger.Warning($"{ResponseApi.I41.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I41.ToEnumString());
                        return result;
                    }
                }

                if (accessMemberApi.LimitCallCount < accessMemberApi.RequestCallCount)
                {
                    logger.Warning($"{ResponseApi.I22.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                    result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I22.ToEnumString());
                    return result;
                }

                string cacheKey = $"{ModuleConfiguration.ModuleID}|{apiService.APIServiceID}|{requestUrl}";
                if (apiService.CacheDuration > 0)
                {
                    ActionResult? actionResult = null;
                    if (memoryCache.TryGetValue(cacheKey, out actionResult) == true)
                    {
                        if (actionResult != null)
                        {
                            UpdateUsageAPI(format, apiService, accessMemberApi);
                            return actionResult;
                        }
                    }
                }

                var dataSource = ModuleConfiguration.ApiDataSource.FirstOrDefault(item =>
                    item.DataSourceID == apiService.DataSourceID
                );

                if (dataSource == null)
                {
                    dataSource = openapiClient.GetApiDataSource(apiService.DataSourceID);
                    if (dataSource == null)
                    {
                        logger.Warning($"{ResponseApi.I24.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I24.ToEnumString());
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
                    apiParameters = openapiClient.GetApiParameters(apiService.APIServiceID);
                    if (apiParameters == null)
                    {
                        apiParameters = new List<ApiParameter>();
                    }

                    ModuleConfiguration.ApiParameters.Add(apiService.APIServiceID, apiParameters);
                }

                foreach (var apiParameter in apiParameters)
                {
                    string parameterID = apiParameter.ParameterID.Replace("@", "").Replace("#", "").Replace(":", "");
                    var parameterValue = parameters.ContainsKey(parameterID) == true ? parameters[parameterID].ToStringSafe() : "";
                    if (string.IsNullOrEmpty(parameterValue) == true && apiParameter.RequiredYN == true)
                    {
                        logger.Warning($"{ResponseApi.I23.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I23.ToEnumString());
                        return result;
                    }

                    if (string.IsNullOrEmpty(parameterValue) == true)
                    {
                        parameterValue = apiParameter.DefaultValue != "NULL" ? apiParameter.DefaultValue : null;
                    }

                    if (parameters.ContainsKey(parameterID) == true)
                    {
                        parameters[parameterID] = parameterValue;
                    }
                    else
                    {
                        parameters.Add(parameterID, parameterValue);
                    }
                }

                var executeResult = await openapiClient.ExecuteSQL(apiService.CommandText, dataSource, apiParameters, parameters);
                if (string.IsNullOrEmpty(executeResult.Item1) == false)
                {
                    result = StatusCode(StatusCodes.Status400BadRequest, executeResult.Item1);
                }
                else
                {
                    UpdateUsageAPI(format, apiService, accessMemberApi);

                    using var dataSet = executeResult.Item2;
                    if (dataSet != null)
                    {
                        dataSet.DataSetName = "dataSet";
                        StringBuilder sb = new StringBuilder(256);
                        switch (format)
                        {
                            case "json":
                                List<int> mergeDataCounts = new List<int>();
                                List<string> mergeMetaDatas = new List<string>();
                                List<object> mergeDatas = new List<object>();
                                for (int i = 0; i < dataSet.Tables.Count; i++)
                                {
                                    sb.Clear();
                                    DataTable table = dataSet.Tables[i];
                                    for (int k = 0; k < table.Columns.Count; k++)
                                    {
                                        var column = table.Columns[k];
                                        sb.Append($"{column.ColumnName}:{JsonExtensions.toMetaDataType(column.DataType.Name)};");
                                    }

                                    mergeDataCounts.Add(table.Rows.Count);
                                    mergeMetaDatas.Add(sb.ToString());
                                    mergeDatas.Add(DataTableJson.ToJsonObject(table.TableName, table));
                                }

                                result = Content(JsonConvert.SerializeObject(new
                                {
                                    Count = mergeDataCounts,
                                    Meta = mergeMetaDatas,
                                    Result = mergeDatas
                                }), "application/json");
                                break;
                            case "xml":
                                using (StringWriter sw = new StringWriter(sb))
                                {
                                    dataSet.WriteXml(sw, XmlWriteMode.WriteSchema);
                                }
                                result = Content(sb.ToString(), "text/xml");
                                break;
                            case "soap":
                                using (var stream = new MemoryStream())
                                {
                                    SoapFormatter formatter = new SoapFormatter();
                                    formatter.Serialize(stream, dataSet);
                                    result = File(stream.ToArray(), "text/xml");
                                }
                                break;
                            case "rss":
                                if (dataSet.Tables.Count != 2 || dataSet.Tables[0].Rows.Count == 0)
                                {
                                    result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I25.ToEnumString());
                                    return result;
                                }

                                var rssFeed = CreateFeed("rss", dataSet.Tables[0].Rows[0], dataSet.Tables[1].Rows);
                                using (var stream = new MemoryStream())
                                using (XmlWriter xmlWriter = XmlWriter.Create(stream, new XmlWriterSettings
                                {
                                    Encoding = Encoding.UTF8,
                                    Indent = false
                                }))
                                {
                                    rssFeed.SaveAsRss20(xmlWriter);
                                    xmlWriter.Flush();
                                    result = File(stream.ToArray(), "text/xml");
                                }
                                break;
                            case "atom":
                                if (dataSet.Tables.Count != 2 || dataSet.Tables[0].Rows.Count == 0)
                                {
                                    result = StatusCode(StatusCodes.Status400BadRequest, ResponseApi.I25.ToEnumString());
                                    return result;
                                }

                                var atomFeed = CreateFeed("rss", dataSet.Tables[0].Rows[0], dataSet.Tables[1].Rows);
                                using (var stream = new MemoryStream())
                                using (XmlWriter xmlWriter = XmlWriter.Create(stream, new XmlWriterSettings
                                {
                                    Encoding = Encoding.UTF8,
                                    Indent = false
                                }))
                                {
                                    atomFeed.SaveAsAtom10(xmlWriter);
                                    xmlWriter.Flush();
                                    result = File(stream.ToArray(), "text/xml");
                                }
                                break;
                        }

                        if (apiService.CacheDuration > 0)
                        {
                            if (memoryCache.Get(cacheKey) == null)
                            {
                                ModuleConfiguration.CacheKeys.Add(cacheKey);

                                var cacheEntryOptions = new MemoryCacheEntryOptions()
                                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(apiService.CacheDuration))
                                    .RegisterPostEvictionCallback((key, value, reason, state) =>
                                    {
                                        ModuleConfiguration.CacheKeys.Remove(key.ToStringSafe());
                                    });

                                memoryCache.Set(cacheKey, result, cacheEntryOptions);
                            }
                            else
                            {
                                ModuleConfiguration.CacheKeys.Remove(cacheKey);
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                result = StatusCode(StatusCodes.Status500InternalServerError, "99: UNKNOWN_ERROR, 기타 에러");
                logger.Error(exception, "[{LogCategory}] " + $"parameters: {JsonConvert.SerializeObject(parameters)}", "ExecutionController/Main");
            }

            return result;
        }

        private void UpdateUsageAPI(string format, ApiService apiService, AccessMemberApi accessMemberApi)
        {
            accessMemberApi.RequestCallCount = accessMemberApi.RequestCallCount + 1;
            accessMemberApi.CumulativeCallCount = accessMemberApi.CumulativeCallCount + 1;
            openapiClient.UsageAPIAggregate(apiService.APIServiceID, accessMemberApi.AccessID, format);
        }

        private List<string> GetMemoryCacheKeys(string apiServiceID)
        {
            List<string> result = new List<string>();
            foreach (var cacheKey in ModuleConfiguration.CacheKeys)
            {
                if (cacheKey.StartsWith($"{ModuleConfiguration.ModuleID}|{apiServiceID}|") == true)
                {
                    result.Add(cacheKey);
                }
            }

            return result;
        }

        private SyndicationFeed CreateFeed(string format, DataRow rowHeader, DataRowCollection rows)
        {
            string baseUrl = Request.GetBaseUrl();
            var feed = new SyndicationFeed();
            feed.Id = baseUrl;
            string title = rowHeader.GetString("Title").ToStringSafe();
            if (string.IsNullOrEmpty(title) == false)
            {
                feed.Title = new TextSyndicationContent(title);
            }

            string description = rowHeader.GetString("Description").ToStringSafe();
            if (string.IsNullOrEmpty(description) == false)
            {
                feed.Description = new TextSyndicationContent(description);
            }

            string copyright = rowHeader.GetString("CopyRight").ToStringSafe();
            if (string.IsNullOrEmpty(copyright) == false)
            {
                feed.Copyright = new TextSyndicationContent(copyright);
            }

            string generator = rowHeader.GetString("Generator").ToStringSafe();
            if (string.IsNullOrEmpty(generator) == false)
            {
                feed.Generator = generator;
            }

            string imageUrl = rowHeader.GetString("ImageUrl").ToStringSafe();
            if (string.IsNullOrEmpty(imageUrl) == false)
            {
                Uri? parseUri;
                if (Uri.TryCreate(imageUrl, UriKind.Absolute, out parseUri) == true)
                {
                    feed.ImageUrl = parseUri;
                }
            }

            string lastUpdatedTime = rowHeader.GetString("LastUpdatedTime").ToStringSafe();
            if (string.IsNullOrEmpty(lastUpdatedTime) == false)
            {
                DateTime parseDateTime;
                if (DateTime.TryParse(lastUpdatedTime, out parseDateTime) == true)
                {
                    feed.LastUpdatedTime = new DateTimeOffset(parseDateTime);
                }
            }

            var items = new List<SyndicationItem>();
            for (int i = 0; i < rows.Count; i++)
            {
                DataRow row = rows[i];
                var item = new SyndicationItem();

                string itemUrl = row.GetString("ItemUrl").ToStringSafe();
                if (string.IsNullOrEmpty(itemUrl) == false)
                {
                    Uri? parseUri;
                    if (Uri.TryCreate(itemUrl, UriKind.Absolute, out parseUri) == true)
                    {
                        item.Id = parseUri.ToString();
                    }
                }

                string itemTitle = row.GetString("Title").ToStringSafe();
                if (string.IsNullOrEmpty(itemTitle) == false)
                {
                    item.Title = new TextSyndicationContent(itemTitle);
                }

                string itemLinks = row.GetString("Links").ToStringSafe();
                if (string.IsNullOrEmpty(itemLinks) == false)
                {
                    var links = itemLinks.SplitComma();
                    foreach (var link in links)
                    {
                        item.Links.Add(SyndicationLink.CreateAlternateLink(new Uri(link)));
                    }
                }

                string itemSummary = row.GetString("Summary").ToStringSafe();
                if (string.IsNullOrEmpty(itemSummary) == false)
                {
                    item.Summary = SyndicationContent.CreateHtmlContent(itemSummary);
                }

                string itemContent = row.GetString("Content").ToStringSafe();
                if (string.IsNullOrEmpty(itemContent) == false)
                {
                    item.Content = SyndicationContent.CreateHtmlContent(itemContent);
                }

                string publishDate = row.GetString("PublishDate").ToStringSafe();
                if (string.IsNullOrEmpty(publishDate) == false)
                {
                    DateTime parseDateTime;
                    if (DateTime.TryParse(publishDate, out parseDateTime) == true)
                    {
                        item.PublishDate = new DateTimeOffset(parseDateTime);
                    }
                }

                string itemAuthorEmail = row.GetString("AuthorEmail").ToStringSafe();
                string itemAuthorName = row.GetString("AuthorName").ToStringSafe();
                string itemAuthorUrl = row.GetString("AuthorUrl").ToStringSafe();
                if (string.IsNullOrEmpty(itemAuthorEmail) == false && string.IsNullOrEmpty(itemAuthorName) == false)
                {
                    item.Authors.Add(new SyndicationPerson(itemAuthorEmail, itemAuthorName, itemAuthorUrl));
                }
                else if (string.IsNullOrEmpty(itemAuthorEmail) == false)
                {
                    item.Authors.Add(new SyndicationPerson(itemAuthorEmail));
                }

                items.Add(item);
            }

            feed.Items = items;
            return feed;
        }
    }
}
