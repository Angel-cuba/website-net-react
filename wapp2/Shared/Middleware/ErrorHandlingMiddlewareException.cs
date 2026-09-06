using System.Net;

namespace Wapp2.Shared.Middleware;

public class ErrorHandlingMiddlewareException : Exception
{
    public HttpStatusCode StatusCode { get; }

    public ErrorHandlingMiddlewareException(string message, HttpStatusCode statusCode)
        : base(message)
    {
        StatusCode = statusCode;
    }
}
