using System.Collections.Generic;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;

using Newtonsoft.Json;

namespace HandStack.Web.Extensions
{
    public static class HtmxExtensions
    {
        public static bool IsHtmxRequest(this HttpRequest request)
        {
            return request.Headers.ContainsKey("HX-Request");
        }

        public static bool IsHtmxRequest(this HttpContext context)
        {
            return context.Request.IsHtmxRequest();
        }

        public static bool IsHtmxRequest(this ActionContext context)
        {
            return context.HttpContext.Request.IsHtmxRequest();
        }

        public static bool IsHtmxRequest(this Controller controller)
        {
            return controller.HttpContext.Request.IsHtmxRequest();
        }

        public static bool IsHtmxRequest(this IHtmlHelper htmlHelper)
        {
            return htmlHelper.ViewContext.HttpContext.Request.IsHtmxRequest();
        }

        public static bool IsHtmxBoosted(this HttpRequest request)
        {
            return request.Headers.ContainsKey("HX-Boosted");
        }

        public static string GetCurrentUrl(this HttpRequest request)
        {
            return request.Headers.TryGetValue("HX-Current-URL", out var value)
                ? value.ToString()
                : request.Headers["Referer"].ToString();
        }

        public static bool IsHistoryRestoreRequest(this HttpRequest request)
        {
            return request.Headers.TryGetValue("HX-History-Restore-Request", out var value) && value == "true";
        }

        public static string GetPromptResponse(this HttpRequest request)
        {
            return request.Headers.TryGetValue("HX-Prompt", out var value) ? value.ToString() : string.Empty;
        }

        public static string GetTargetId(this HttpRequest request)
        {
            return request.Headers.TryGetValue("HX-Target", out var value) ? value.ToString() : string.Empty;
        }

        public static string GetTriggerId(this HttpRequest request)
        {
            return request.Headers.TryGetValue("HX-Trigger", out var value) ? value.ToString() : string.Empty;
        }

        public static string GetTriggerName(this HttpRequest request)
        {
            return request.Headers.TryGetValue("HX-Trigger-Name", out var value) ? value.ToString() : string.Empty;
        }

        public static void HtmxPushUrl(this HttpResponse response, string url)
        {
            response.Headers.Append("HX-Push-Url", url);
        }

        public static void HtmxReplaceUrl(this HttpResponse response, string url)
        {
            response.Headers.Append("HX-Replace-Url", url);
        }

        public static void HtmxScroll(this HttpResponse response, string selector = "top")
        {
            response.Headers.Append("HX-Scroll", selector);
        }

        public static void HtmxTriggerEvent(this HttpResponse response, string eventName)
        {
            response.Headers.Append("HX-Trigger", eventName);
        }

        public static void HtmxTriggerEvent(this HttpResponse response, string eventName, string value)
        {
            var triggerData = new Dictionary<string, string>
            {
                { eventName, value }
            };
            response.Headers.Append("HX-Trigger", JsonConvert.SerializeObject(triggerData));
        }

        public static void HtmxTriggerEvents(this HttpResponse response, Dictionary<string, object> events)
        {
            response.Headers.Append("HX-Trigger", JsonConvert.SerializeObject(events));
        }

        public static void HtmxTriggerAfterSwap(this HttpResponse response, string eventName)
        {
            response.Headers.Append("HX-Trigger-After-Swap", eventName);
        }

        public static void HtmxTriggerAfterSwap(this HttpResponse response, Dictionary<string, object> events)
        {
            response.Headers.Append("HX-Trigger-After-Swap", JsonConvert.SerializeObject(events));
        }

        public static void HtmxTriggerAfterSettle(this HttpResponse response, string eventName)
        {
            response.Headers.Append("HX-Trigger-After-Settle", eventName);
        }

        public static void HtmxTriggerAfterSettle(this HttpResponse response, Dictionary<string, object> events)
        {
            response.Headers.Append("HX-Trigger-After-Settle", JsonConvert.SerializeObject(events));
        }

        public static void HtmxRedirect(this HttpResponse response, string url, int delay = 0)
        {
            response.Headers.Append("HX-Redirect", url);
            if (delay > 0)
            {
                response.Headers.Append("HX-Redirect-Delay", delay.ToString());
            }
        }

        public static void HtmxRefresh(this HttpResponse response)
        {
            response.Headers.Append("HX-Refresh", "true");
        }

        public static void HtmxLocation(this HttpResponse response, string path, string? source = null, string? @event = null, string? handler = null, string? target = null, string? swap = null, object? values = null, object? headers = null)
        {
            var locationData = new Dictionary<string, object> { { "path", path } };
            if (source != null) locationData["source"] = source;
            if (@event != null) locationData["event"] = @event;
            if (handler != null) locationData["handler"] = handler;
            if (target != null) locationData["target"] = target;
            if (swap != null) locationData["swap"] = swap;
            if (values != null) locationData["values"] = values;
            if (headers != null) locationData["headers"] = headers;

            response.Headers.Append("HX-Location", JsonConvert.SerializeObject(locationData));
        }

        // 교체 방식을 지정 (innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend)
        public static void HtmxSwap(this HttpResponse response, string swapMode)
        {
            response.Headers.Append("HX-Reswap", swapMode);
        }

        public static void HtmxRetarget(this HttpResponse response, string cssSelector)
        {
            response.Headers.Append("HX-Retarget", cssSelector);
        }

        public static void HtmxReselect(this HttpResponse response, string cssSelector)
        {
            response.Headers.Append("HX-Reselect", cssSelector);
        }

        public static HtmxResult HtmxPartial<T>(this Controller controller, string viewName, T model)
        {
            return new HtmxResult
            {
                ViewName = viewName,
                Model = model,
                Controller = controller
            };
        }

        public static HtmxResult HtmxPartial(this Controller controller, string viewName)
        {
            return new HtmxResult
            {
                ViewName = viewName,
                Controller = controller
            };
        }
    }

    public class HtmxResult : IActionResult
    {
        public string ViewName { get; set; } = string.Empty;
        public object? Model { get; set; }
        public Controller Controller { get; set; } = null!;
        private readonly Dictionary<string, string> headers = new Dictionary<string, string>();

        public async Task ExecuteResultAsync(ActionContext context)
        {
            foreach (var header in headers)
            {
                context.HttpContext.Response.Headers.Append(header.Key, header.Value);
            }

            var viewResult = Model != null
                ? Controller.PartialView(ViewName, Model)
                : Controller.PartialView(ViewName);

            await viewResult.ExecuteResultAsync(context);
        }

        public HtmxResult WithHeader(string name, string value)
        {
            headers[name] = value;
            return this;
        }

        public HtmxResult WithPushUrl(string url)
        {
            return WithHeader("HX-Push-Url", url);
        }

        public HtmxResult WithTriggerEvent(string eventName)
        {
            return WithHeader("HX-Trigger", eventName);
        }

        public HtmxResult WithTriggerEvent(string eventName, string value)
        {
            var triggerData = new Dictionary<string, string>
            {
                { eventName, value }
            };
            return WithHeader("HX-Trigger", JsonConvert.SerializeObject(triggerData));
        }

        public HtmxResult WithTriggerEvents(Dictionary<string, object> events)
        {
            return WithHeader("HX-Trigger", JsonConvert.SerializeObject(events));
        }

        public HtmxResult WithRefresh()
        {
            return WithHeader("HX-Refresh", "true");
        }

        public HtmxResult WithRedirect(string url)
        {
            return WithHeader("HX-Redirect", url);
        }

        public HtmxResult WithScroll(string selector = "top")
        {
            return WithHeader("HX-Scroll", selector);
        }

        public HtmxResult WithSwap(string swapMode)
        {
            return WithHeader("HX-Reswap", swapMode);
        }

        public HtmxResult WithRetarget(string cssSelector)
        {
            return WithHeader("HX-Retarget", cssSelector);
        }
    }
}
