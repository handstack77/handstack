using System.Collections.Generic;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

namespace HandStack.Web.Extensions
{
    public static class HtmxExtensions
    {
        public static bool IsHtmxRequest(this HttpRequest request)
        {
            return request.Headers.ContainsKey("HX-Request");
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

        public static IActionResult WithPushUrl(this IActionResult result, HttpResponse response, string url)
        {
            response.Headers.Append("HX-Push-Url", url);
            return result;
        }

        public static IActionResult WithReplaceUrl(this IActionResult result, HttpResponse response, string url)
        {
            response.Headers.Append("HX-Replace-Url", url);
            return result;
        }

        public static IActionResult WithScroll(this IActionResult result, HttpResponse response, string selector = "top")
        {
            response.Headers.Append("HX-Scroll", selector);
            return result;
        }

        public static IActionResult WithTriggerEvent(this IActionResult result, HttpResponse response, string eventName)
        {
            response.Headers.Append("HX-Trigger", eventName);
            return result;
        }

        public static IActionResult WithTriggerEvent(this IActionResult result, HttpResponse response, string eventName, string value)
        {
            var triggerData = new Dictionary<string, string>
            {
                { eventName, value }
            };
            response.Headers.Append("HX-Trigger", JsonConvert.SerializeObject(triggerData));
            return result;
        }

        public static IActionResult WithTriggerEvents(this IActionResult result, HttpResponse response, Dictionary<string, object> events)
        {
            response.Headers.Append("HX-Trigger", JsonConvert.SerializeObject(events));
            return result;
        }

        public static IActionResult WithRedirect(this IActionResult result, HttpResponse response, string url, int delay = 0)
        {
            response.Headers.Append("HX-Redirect", url);
            if (delay > 0)
            {
                response.Headers.Append("HX-Redirect-Delay", delay.ToString());
            }
            return result;
        }

        public static IActionResult WithRefresh(this IActionResult result, HttpResponse response, bool refresh = true)
        {
            if (refresh)
            {
                response.Headers.Append("HX-Refresh", "true");
            }
            return result;
        }

        public static IActionResult WithLocation(this IActionResult result, HttpResponse response, string path)
        {
            response.Headers.Append("HX-Location", JsonConvert.SerializeObject(new { path }));
            return result;
        }

        // 교체 방식을 지정 (innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend)
        public static IActionResult WithSwap(this IActionResult result, HttpResponse response, string swapMode)
        {
            response.Headers.Append("HX-Reswap", swapMode);
            return result;
        }

        public static IActionResult WithRetarget(this IActionResult result, HttpResponse response, string cssSelector)
        {
            response.Headers.Append("HX-Retarget", cssSelector);
            return result;
        }

        public static IActionResult WithReselect(this IActionResult result, HttpResponse response, string cssSelector)
        {
            response.Headers.Append("HX-Reselect", cssSelector);
            return result;
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
