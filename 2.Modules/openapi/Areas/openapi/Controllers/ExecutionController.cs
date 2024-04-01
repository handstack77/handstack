using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlTypes;
using System.IO;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Enumeration;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using MySqlX.XDevAPI.Common;

using Newtonsoft.Json;

using openapi.Encapsulation;
using openapi.Entity;
using openapi.Extensions;


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
                        if (apiService.FormatJsonYN == false && apiService.FormatXmlYN == false && apiService.FormatSoapYN == false && apiService.FormatRssYN == false && apiService.FormatAtomYN == false)
                        {
                            apiService.FormatJsonYN = true;
                        }
                        ModuleConfiguration.ApiServices.Add(apiService);
                    }
                }

                var format = parameters.ContainsKey("Format") == true ? parameters["Format"].ToStringSafe().ToLower() : "json";
                switch (format)
                {
                    case "json":
                    case "xml":
                    case "rss":
                    case "atom":
                        break;
                    default:
                        logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                        {
                            InterfaceID = interfaceID,
                            AccessID = accessID
                        }));
                        return result;
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
                    dataSource = ModuleExtensions.ExecuteMetaSQLPoco<ApiDataSource>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD04", new
                    {
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
                    var parameterValue = parameters.ContainsKey(parameterID) == true ? parameters[parameterID].ToStringSafe() : "";
                    if (string.IsNullOrEmpty(parameterValue) == true && apiParameter.RequiredYN == true)
                    {
                        logger.Warning($"{ResponseApi.I23.ToEnumString()}: " + JsonConvert.SerializeObject(parameters));
                        result = StatusCode(400, ResponseApi.I23.ToEnumString());
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

                var executeResult = await openapiClient.ExecuteSQL(apiService, dataSource, accessMemberApi, apiParameters, parameters);
                if (string.IsNullOrEmpty(executeResult.Item1) == false)
                {
                    result = StatusCode(400, executeResult.Item1);
                }
                else
                {
                    using var dataSet = executeResult.Item2;
                    if (dataSet == null)
                    {
                    }
                    else
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
                            case "rss":
                                if (dataSet.Tables.Count != 2 || dataSet.Tables[0].Rows.Count == 0)
                                {
                                    result = StatusCode(400, ResponseApi.I25.ToEnumString());
                                    return result;
                                }

                                var rssFeed = CreateFeed("rss", dataSet.Tables[0].Rows[0], dataSet.Tables[1].Rows);
                                using (var stream = new MemoryStream())
                                using (XmlWriter xmlWriter = XmlWriter.Create(stream, new XmlWriterSettings
                                {
                                    Encoding = Encoding.UTF8,
                                    NewLineHandling = NewLineHandling.Entitize,
                                    NewLineOnAttributes = true,
                                    Indent = true
                                }))
                                {
                                    rssFeed.SaveAsRss20(xmlWriter);
                                    xmlWriter.Flush();
                                    result = File(stream.ToArray(), "application/rss+xml; charset=utf-8");
                                }
                                break;
                            case "atom":
                                if (dataSet.Tables.Count != 2 || dataSet.Tables[0].Rows.Count == 0)
                                {
                                    result = StatusCode(400, ResponseApi.I25.ToEnumString());
                                    return result;
                                }

                                var atomFeed = CreateFeed("rss", dataSet.Tables[0].Rows[0], dataSet.Tables[1].Rows);
                                using (var stream = new MemoryStream())
                                using (XmlWriter xmlWriter = XmlWriter.Create(stream, new XmlWriterSettings
                                {
                                    Encoding = Encoding.UTF8,
                                    NewLineHandling = NewLineHandling.Entitize,
                                    NewLineOnAttributes = true,
                                    Indent = true
                                }))
                                {
                                    atomFeed.SaveAsAtom10(xmlWriter);
                                    xmlWriter.Flush();
                                    result = File(stream.ToArray(), "application/atom+xml; charset=utf-8");
                                }
                                break;
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                result = StatusCode(500, "99: UNKNOWN_ERROR, 기타 에러");
                logger.Error(exception, "[{LogCategory}] " + $"parameters: {JsonConvert.SerializeObject(parameters)}", "ExecutionController/Main");
            }

            return result;
        }

        private SyndicationFeed CreateFeed(string format, DataRow rowHeader, DataRowCollection rows)
        {
            string baseUrl = Request.GetBaseUrl();
            var feed = new SyndicationFeed();
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
