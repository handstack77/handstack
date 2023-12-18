using MediatR;

namespace dbclient.Events
{
    public class DbClientRequest : IRequest<object?>
    {
        public object? Request { get; set; }

        public DbClientRequest(object? request)
        {
            Request = request;
        }
    }
}
