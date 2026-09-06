using System.Net;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Wapp2.Shared.DTOs;

namespace Wapp2.Shared.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, IWebHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ErrorHandlingMiddlewareException ex)
        {
            await WriteErrorResponse(context, ex.StatusCode, ex.Message);
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
        catch (SqlException ex)
        {
            var message = environment.IsDevelopment()
                ? ex.Message
                : "A database error occurred.";

            await WriteErrorResponse(context, HttpStatusCode.InternalServerError, message);
        }
        catch (Exception)
        {
            var message = environment.IsDevelopment()
                ? "An unexpected error occurred while processing the request."
                : "An unexpected error occurred.";

            await WriteErrorResponse(
                context,
                HttpStatusCode.InternalServerError,
                message
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
