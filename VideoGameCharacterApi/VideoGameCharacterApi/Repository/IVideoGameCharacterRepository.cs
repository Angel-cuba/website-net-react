using VideoGameCharacterApi.Models;

namespace VideoGameCharacterApi.Repository.interfaces
{
    public interface IVideoGameCharacterRepository
    {
        Task<IEnumerable<CharacterModel>> GetCharacters();
        Task<CharacterModel?> GetCharacterById(int id);
        Task<CharacterModel> CreateCharacter(CharacterModel character);
        Task<CharacterModel> UpdateCharacter(int id, CharacterModel character);
        Task<bool> DeleteCharacter(int id);
        Task<IEnumerable<CharacterModel>> SearchCharacters(string searchTerm);
    }
}