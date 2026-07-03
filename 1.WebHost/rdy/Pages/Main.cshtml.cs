using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace rdy.Pages
{
    public class MainModel : PageModel
    {
        [BindProperty]
        public string Method { get; set; } = "GET";

        public void OnGet()
        {
            Method = "GET";
        }

        public void OnPost()
        {
            Method = "POST";
        }
    }
}
