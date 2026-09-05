using Tasks.Repositories;
using Tasks.Services;
using Tasks.Interfaces;
using Wapp2.Shared.Database;
using Wapp2.Auth.Interfaces;
using Wapp2.Auth.Services;
using Wapp2.Users.Interfaces;
using Wapp2.Users.Repositories;
using Wapp2.Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();


// Add repository and service registrations
// Add user repository registration
builder.Services.AddScoped<IUserRepository, UserRepository>();
// Task repository
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();

// Add authentication services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();

// Add database connection factory
builder.Services.AddScoped<ISqlConnectionFactory, SqlConnectionFactory>();

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendLocal", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// Here you can add other services like Swagger, Authentication, etc. if needed.
var app = builder.Build();


// Enable CORS for the frontend application
app.UseCors("FrontendLocal");
app.UseMiddleware<ErrorHandlingMiddleware>();

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
