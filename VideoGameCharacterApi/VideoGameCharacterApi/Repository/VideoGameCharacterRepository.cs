using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using VideoGameCharacterApi.Models;
using VideoGameCharacterApi.Repository.interfaces;

namespace VideoGameCharacterApi.Repository;

public class VideoGameCharacterRepository(IConfiguration configuration) : IVideoGameCharacterRepository
{
    private readonly string _dbConnectionString = configuration.GetConnectionString("DefaultConnection")!;


    public async Task<IEnumerable<CharacterModel>> GetCharacters()
    {
        using IDbConnection connection = new SqlConnection(_dbConnectionString);
        return await connection.QueryAsync<CharacterModel>("SELECT * FROM dbo.CharacterDb");
        
    }
    public Task<CharacterModel?> GetCharacterById(int id)
    {
        throw new NotImplementedException();
    }
    public Task<CharacterModel> CreateCharacter(CharacterModel character)
    {
        throw new NotImplementedException();
    }
    public Task<CharacterModel> UpdateCharacter(int id, CharacterModel character)
    {
        throw new NotImplementedException();
    }
    public Task<bool> DeleteCharacter(int id)
    {
        throw new NotImplementedException();
    }
    public Task<IEnumerable<CharacterModel>> SearchCharacters(string searchTerm)
    {
        throw new NotImplementedException();
    }
}