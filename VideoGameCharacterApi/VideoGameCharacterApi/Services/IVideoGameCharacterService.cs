using VideoGameCharacterApi.Models;

namespace VideoGameCharacterApi.Services.interfaces;
public interface IVideoGameCharacterService
{
    Task<IEnumerable<CharacterModel>> GetCharacters();
    Task<CharacterModel?> GetCharacterById(int id);
    Task<CharacterModel> CreateCharacter(CharacterModel character);
    Task<CharacterModel> UpdateCharacter(int id, CharacterModel character);
    Task<bool> DeleteCharacter(int id);
    Task<IEnumerable<CharacterModel>> SearchCharacters(string searchTerm);
}