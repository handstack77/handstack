using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using dbclient.Entity;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json;

using Serilog;

namespace dbclient.Events
{
    /*
    MediatorRequest mediatorRequest = new MediatorRequest()
    {
        ActionModuleID = ModuleConfiguration.ModuleID,
        SubscribeEventID = "dbclient.Events.ManagedRequest",
    };

    Dictionary<string, object> templateParameters = new Dictionary<string, object>();

    templateParameters.Add("applicationID", "");
    templateParameters.Add("projectID", "");
    templateParameters.Add("dataSourceID", "");
    templateParameters.Add("isolationLevel", "");
    templateParameters.Add("dataProvider", "");
    templateParameters.Add("connectionString", "");
    templateParameters.Add("isEncryption", "");
    templateParameters.Add("tanantPattern", "");
    templateParameters.Add("tanantValue", "");

    mediatorRequest.Parameters = new Dictionary<string, object?>();
    mediatorRequest.Parameters.Add("Method", "AddModuleDataSource");
    mediatorRequest.Parameters.Add("Arguments", templateParameters);

    var sendResponse = await mediatorClient.SendAsync(mediatorRequest);
    */
    public class ManagedRequest : IRequest<object?>
    {
        public string Method { get; set; }

        public Dictionary<string, object>? Arguments { get; set; }

        public ManagedRequest(MediatorRequest request)
        {
            Method = request.Parameters.Get<string>("Method").ToStringSafe();
            Arguments = request.Parameters.Get<Dictionary<string, object>>("Arguments");
        }
    }

    public class ManagedRequestHandler : IRequestHandler<ManagedRequest, object?>
    {
        private ILogger logger { get; }

        public ManagedRequestHandler(ILogger logger)
        {
            this.logger = logger;
        }

        public Task<object?> Handle(ManagedRequest managedAction, CancellationToken cancellationToken)
        {
            object? response = null;
            try
            {
                if (managedAction.Method == "AddModuleDataSource")
                {
                    if (managedAction.Arguments != null)
                    {
                        var item = new DataSource()
                        {
                            ApplicationID = managedAction.Arguments.Get<string>("applicationID").ToStringSafe(),
                            ProjectID = managedAction.Arguments.Get<string>("projectID").ToStringSafe(),
                            DataSourceID = managedAction.Arguments.Get<string>("dataSourceID").ToStringSafe(),
                            TransactionIsolationLevel = managedAction.Arguments.Get<string>("isolationLevel").ToStringSafe(),
                            DataProvider = managedAction.Arguments.Get<string>("dataProvider").ToStringSafe(),
                            ConnectionString = managedAction.Arguments.Get<string>("connectionString").ToStringSafe(),
                            IsEncryption = managedAction.Arguments.Get<string>("isEncryption").ToStringSafe(),
                            TanantPattern = managedAction.Arguments.Get<string>("tanantPattern").ToStringSafe(),
                            TanantValue = managedAction.Arguments.Get<string>("tanantValue").ToStringSafe(),
                        };

                        lock (DatabaseMapper.DataSourceMappings)
                        {
                            try
                            {
                                var dataSourceMappings = DatabaseMapper.DataSourceMappings.Where(x => x.Key.DataSourceID == item.DataSourceID
                                    && x.Value.ApplicationID == item.ApplicationID).ToList();

                                for (var i = dataSourceMappings.Count(); i > 0; i--)
                                {
                                    var mappingItem = dataSourceMappings[i - 1].Key;
                                    DatabaseMapper.DataSourceMappings.Remove(mappingItem);
                                }

                                var tanantMap = new DataSourceTanantKey();
                                tanantMap.ApplicationID = item.ApplicationID;
                                tanantMap.DataSourceID = item.DataSourceID;
                                tanantMap.TanantPattern = "";
                                tanantMap.TanantValue = "";

                                if (DatabaseMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                {
                                    var dataSourceMap = new DataSourceMap();
                                    dataSourceMap.ApplicationID = item.ApplicationID;
                                    dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();
                                    dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                                    dataSourceMap.ConnectionString = item.ConnectionString;
                                    dataSourceMap.TransactionIsolationLevel = string.IsNullOrEmpty(item.TransactionIsolationLevel) ? "ReadCommitted" : item.TransactionIsolationLevel;

                                    if (item.IsEncryption.ParseBool() == true)
                                    {
                                        item.ConnectionString = DatabaseMapper.DecryptConnectionString(item);
                                    }

                                    if (DatabaseMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                    {
                                        DatabaseMapper.DataSourceMappings.Add(tanantMap, dataSourceMap);
                                    }
                                }
                                else
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"DataSourceMappings {JsonConvert.SerializeObject(item)} 등록 실패", "ManagedRequestHandler/AddModuleDataSource");
                                    response = "AddModuleDataSource 오류, 요청값 확인 필요";
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"DataSourceMappings {JsonConvert.SerializeObject(item)} 등록 실패, 오류 - {exception.ToMessage()}", "ManagedRequestHandler/AddModuleDataSource");
                            }
                        }
                    }
                }
                else
                {
                    logger.Warning("[{LogCategory}] " + $"{managedAction.Method} Method 확인 필요", "ManagedRequestHandler/Handle");
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "ManagedRequestHandler/Handle");
            }

            return Task.FromResult(response);
        }
    }
}

