using System;
using System.Collections.Generic;
using System.Reflection;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json.Linq;

using Serilog;

namespace HandStack.Web.ApiClient
{
    public class MediatorClient : IDisposable
    {
        private readonly IMediator mediator;
        private readonly ILogger logger;

        private static Dictionary<string, JObject> apiServices = new Dictionary<string, JObject>();

        public MediatorClient(ILogger logger, IMediator mediator)
        {
            this.logger = logger;
            this.mediator = mediator;
        }

        public async Task<MediatorResponse> SendAsync(MediatorRequest mediatorRequest)
        {
            var result = new MediatorResponse();
            result.Acknowledge = AcknowledgeType.Failure;
            result.ResponseID = string.Concat(GlobalConfiguration.SystemID, GlobalConfiguration.HostName, mediatorRequest.ReturnType, DateTime.Now.ToString("yyyyMMddHHmmss"));
            result.CorrelationID = mediatorRequest.GlobalID;
            result.Environment = GlobalConfiguration.EnvironmentName;

            var actionModuleID = mediatorRequest.ActionModuleID;
            var subscribeEventID = mediatorRequest.SubscribeEventID;

            var isValidateEventAction = CheckModuleEventAction(actionModuleID, subscribeEventID);
            if (isValidateEventAction == false)
            {
                logger.Error("[{LogCategory}] " + $"actionModuleID: {actionModuleID}, subscribeEventID: {subscribeEventID} 확인 필요", "MediatorClient/SendAsync");
                result.ExceptionText = $"actionModuleID: {actionModuleID}, subscribeEventID: {subscribeEventID} 확인 필요";
            }
            else
            {
                try
                {
                    var type = Assembly.Load(subscribeEventID.Split(".")[0])?.GetType(subscribeEventID);
                    if (type != null)
                    {
                        var instance = Activator.CreateInstance(type, mediatorRequest);
                        if (instance != null)
                        {
                            var eventResponse = await mediator.Send(instance);
                            if (eventResponse is MediatorResponse)
                            {
                                result = (MediatorResponse)eventResponse;
                            }
                            else
                            {
                                result.Acknowledge = AcknowledgeType.Success;
                                result.Result = eventResponse;
                            }
                        }
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"subscribeEventID: {subscribeEventID} Type 확인 필요", "MediatorClient/SendAsync");
                        result.ExceptionText = $"subscribeEventID: {subscribeEventID} Type 확인 필요";
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] " + $"subscribeEventID: {subscribeEventID} 오류", "MediatorClient/SendAsync");
                    result.ExceptionText = $"subscribeEventID: {subscribeEventID} 오류: {exception.Message}";
                }
            }

            return result;
        }

        public async Task PublishAsync(MediatorRequest mediatorRequest)
        {
            var actionModuleID = mediatorRequest.ActionModuleID;
            var subscribeEventID = mediatorRequest.SubscribeEventID;

            var isValidateEventAction = CheckModuleEventAction(actionModuleID, subscribeEventID);
            if (isValidateEventAction == false)
            {
                logger.Error("[{LogCategory}] " + $"actionModuleID: {actionModuleID}, subscribeEventID: {subscribeEventID} 확인 필요", "MediatorClient/PublishAsync");
            }
            else
            {
                try
                {
                    var type = Assembly.Load(subscribeEventID.Split(".")[0])?.GetType(subscribeEventID);
                    if (type != null)
                    {
                        var instance = Activator.CreateInstance(type, mediatorRequest);
                        if (instance != null)
                        {
                            await mediator.Publish(instance);
                        }
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"subscribeEventID: {subscribeEventID} Type 확인 필요", "MediatorClient/PublishAsync");
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] " + $"subscribeEventID: {subscribeEventID} 오류", "MediatorClient/PublishAsync");
                }
            }
        }

        private bool CheckModuleEventAction(string actionModuleID, string subscribeEventID)
        {
            var result = false;
            foreach (var module in GlobalConfiguration.Modules)
            {
                if (module.ModuleID == actionModuleID && module.EventAction.Contains(subscribeEventID) == true)
                {
                    foreach (var module2 in GlobalConfiguration.Modules)
                    {
                        if (module2.SubscribeAction.Contains(subscribeEventID) == true && subscribeEventID.IndexOf(module2.ModuleID) > -1)
                        {
                            result = true;
                            break;
                        }
                    }
                    break;
                }
            }

            return result;
        }

        public void Dispose()
        {
        }
    }
}
