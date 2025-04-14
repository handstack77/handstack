using System.Collections.Generic;
using System.Threading.Tasks;

using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Mvc;

namespace wwwroot.Areas.wwwroot.Controllers
{
    [Area("wwwroot")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class HtmxController : Controller
    {
        private List<ContactModel> GetContacts() => new List<ContactModel>();
        private ContactModel GetContactById(int id) => new ContactModel { Id = id, Name = "연락처 " + id };
        private void DeleteContact(int id) { }
        private void UpdateContact(int id, ContactModel model) { }
        private List<ContactModel> GetContactsPage(int page) => new List<ContactModel>();
        private ContactModel CreateContact(ContactModel model) => new ContactModel { Id = 999, Name = model.Name };
        private bool HasMorePages(int page) => page < 5;

        [HttpGet]
        public IActionResult Index()
        {
            if (Request.IsHtmxRequest())
            {
                return this.HtmxPartial("_ContactsPartial", GetContacts());
            }

            return View(GetContacts());
        }

        [HttpGet("contacts/{id}")]
        public IActionResult Details(int id)
        {
            string currentUrl = Request.GetCurrentUrl();
            string targetElement = Request.GetTargetId();
            var contact = GetContactById(id);

            if (Request.IsHistoryRestoreRequest())
            {
                return this.HtmxPartial("_ContactDetailsPartial", contact)
                    .WithPushUrl($"/contacts/{id}");
            }

            if (Request.IsHtmxBoosted())
            {
                return this.HtmxPartial("_ContactDetailsPartial", contact)
                    .WithPushUrl($"/contacts/{id}");
            }

            return View(contact);
        }

        [HttpDelete("contacts/{id}")]
        public IActionResult Delete(int id)
        {
            string triggerId = Request.GetTriggerId();

            if (!string.IsNullOrEmpty(triggerId))
            {
                System.Console.WriteLine($"삭제 요청이 {triggerId} 요소에서 트리거됨");
            }

            DeleteContact(id);
            Response.HtmxTriggerEvent("showNotification", "연락처가 삭제되었습니다.");
            return Content("<div id='notification' class='alert alert-success'>연락처가 삭제되었습니다.</div>");
                
        }

        [HttpPut("contacts/{id}")]
        public IActionResult Update(int id, [FromForm] ContactModel model)
        {
            string promptResponse = Request.GetPromptResponse();

            if (!string.IsNullOrEmpty(promptResponse))
            {
                model.Name = promptResponse;
            }

            string triggerName = Request.GetTriggerName();

            UpdateContact(id, model);

            var events = new Dictionary<string, object>
            {
                { "showMessage", "연락처가 업데이트되었습니다." },
                { "contactUpdated", new { id = id, name = model.Name } }
            };

            return this.HtmxPartial("_ContactPartial", GetContactById(id))
                .WithTriggerEvents(events);
        }

        [HttpGet("contacts/load-more")]
        public async Task<IActionResult> LoadMore(int page)
        {
            if (!Request.IsHtmxRequest())
            {
                return BadRequest("HTMX 요청만 허용됩니다.");
            }

            await Task.Delay(500);

            var moreContacts = GetContactsPage(page);

            if (moreContacts.Count == 0)
            {
                Response.HtmxTriggerEvent("noMoreContacts", "true");
                return Content("");
            }

            bool hasMorePages = HasMorePages(page + 1);

            var result = this.HtmxPartial("_ContactListPartial", moreContacts);

            return result.WithSwap("beforeend");
        }

        [HttpPost("contacts/create")]
        public IActionResult Create([FromForm] ContactModel model)
        {
            if (!ModelState.IsValid)
            {
                return this.HtmxPartial("_CreateFormPartial", model)
                    .WithTriggerEvent("showValidationErrors", "true");
            }

            var newContact = CreateContact(model);
            var events = new Dictionary<string, object>
            {
                { "showNotification", "연락처가 성공적으로 생성되었습니다." },
                { "clearForm", true }
            };

            return this.HtmxPartial("_ContactPartial", newContact)
                .WithTriggerEvents(events)
                .WithScroll("#contacts-container")
                .WithSwap("afterbegin");
        }

        [HttpGet("contacts/{id}/quick-view")]
        public IActionResult QuickView(int id)
        {
            var contact = GetContactById(id);

            return this.HtmxPartial("_ContactQuickViewPartial", contact)
                .WithRetarget("#modal-content")
                .WithTriggerEvent("showModal");
        }
    }

    public class ContactModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }
}
