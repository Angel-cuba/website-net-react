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


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run("http://localhost:5008");
