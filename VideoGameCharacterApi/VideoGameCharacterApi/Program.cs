using VideoGameCharacterApi.Repository;
using VideoGameCharacterApi.Repository.interfaces;
using VideoGameCharacterApi.Services;
using VideoGameCharacterApi.Services.interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();

builder.Services.AddScoped<IVideoGameCharacterRepository, VideoGameCharacterRepository>();
builder.Services.AddScoped<IVideoGameCharacterService, VideoGameCharacterService>();

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


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseCors("FrontendLocal");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
