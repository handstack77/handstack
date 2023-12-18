using MediatR;

namespace function.Events
{
    public class FunctionRequest : IRequest<object?>
    {
        public object? Request { get; set; }

        public FunctionRequest(object? request)
        {
            Request = request;
        }
    }
}
