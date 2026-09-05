using Tasks.Repositories;
using Tasks.Services;
using Tasks.Interfaces;
using Wapp2.Shared.Database;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();

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

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();