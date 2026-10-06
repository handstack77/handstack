using System;
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
        private static List<ContactModel> GetContacts() => [];
        private static ContactModel GetContactById(int id) => new() { Id = id, Name = "연락처 " + id };
        private static void DeleteContact() { }
        private static void UpdateContact() { }
        private static List<ContactModel> GetContactsPage() => [];
        private static ContactModel CreateContact(ContactModel model) => new() { Id = 999, Name = model.Name };
        private static bool HasMorePages(int page) => page < 5;

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
            var triggerId = Request.GetTriggerId();

            if (!string.IsNullOrWhiteSpace(triggerId))
            {
                System.Console.WriteLine($"삭제 요청이 {triggerId} 요소에서 트리거됨");
            }

            DeleteContact();
            Response.HtmxTriggerEvent("showNotification", "연락처가 삭제되었습니다.");
            return Content("<div id='notification' class='alert alert-success'>연락처가 삭제되었습니다.</div>");

        }

        [HttpPut("contacts/{id}")]
        public IActionResult Update(int id, [FromForm] ContactModel model)
        {
            ArgumentNullException.ThrowIfNull(model);

            var promptResponse = Request.GetPromptResponse();

            if (!string.IsNullOrWhiteSpace(promptResponse))
            {
                model.Name = promptResponse;
            }


            UpdateContact();

            var events = new Dictionary<string, object>
            {
                { "showMessage", "연락처가 업데이트되었습니다." },
                { "contactUpdated", new { id, name = model.Name } }
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

            var moreContacts = GetContactsPage();

            if (moreContacts.Count == 0)
            {
                Response.HtmxTriggerEvent("noMoreContacts", "true");
                return Content("");
            }


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

            ArgumentNullException.ThrowIfNull(model);
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
