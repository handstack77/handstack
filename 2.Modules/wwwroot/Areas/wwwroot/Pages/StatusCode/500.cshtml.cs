using System.IO;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

using Serilog;

namespace wwwroot.Areas.wwwroot.Pages.StatusCode
{
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    [IgnoreAntiforgeryToken]
    public class _500Model : PageModel
    {
        public string ExceptionMessage { get; set; }
        private readonly ILogger logger;

        public _500Model(ILogger logger)
        {
            this.logger = logger;
            ExceptionMessage = "";
        }

        public IActionResult OnGet()
        {
            var exceptionHandlerPathFeature = HttpContext.Features.Get<IExceptionHandlerPathFeature>();

            if (exceptionHandlerPathFeature?.Error is FileNotFoundException)
            {
                ExceptionMessage = $"FileNotFound: {exceptionHandlerPathFeature.Path}";
                logger.Error(ExceptionMessage);

                return RedirectToPage("/StatusCode/404", new
                {
                    area = "Core"
                });
            }

            return Page();
        }
    }
}
