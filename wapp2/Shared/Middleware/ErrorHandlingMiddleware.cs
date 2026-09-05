using System.Net;
using System.Text.Json;
using Wapp2.Shared.DTOs;

namespace Wapp2.Shared.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (InvalidOperationException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.Conflict, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (Exception)
        {
            await WriteErrorResponse(
                context,
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred."
            );
        }
    }

    private static async Task WriteErrorResponse(
        HttpContext context,
        HttpStatusCode statusCode,
        string message
    )
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = ApiResponse<object>.Fail(message);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
