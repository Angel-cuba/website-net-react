using VideoGameCharacterApi.Models;
using VideoGameCharacterApi.Repository.interfaces;
using VideoGameCharacterApi.Services.interfaces;

namespace VideoGameCharacterApi.Services;

public class VideoGameCharacterService(IVideoGameCharacterRepository repository) : IVideoGameCharacterService
{
    public Task<IEnumerable<CharacterModel>> GetCharacters()
    {
        return repository.GetCharacters();
    }

    public Task<CharacterModel?> GetCharacterById(int id)
    {
        return repository.GetCharacterById(id);
    }

    public Task<CharacterModel> CreateCharacter(CharacterModel character)
    {
        return repository.CreateCharacter(character);
    }

    public Task<CharacterModel> UpdateCharacter(int id, CharacterModel character)
    {
        return repository.UpdateCharacter(id, character);
    }

    public Task<bool> DeleteCharacter(int id)
    {
        return repository.DeleteCharacter(id);
    }

    public Task<IEnumerable<CharacterModel>> SearchCharacters(string searchTerm)
    {
        return repository.SearchCharacters(searchTerm);
    }
}
