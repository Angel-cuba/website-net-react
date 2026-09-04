using VideoGameCharacterApi.Models;
using VideoGameCharacterApi.Services.interfaces;
using Microsoft.AspNetCore.Mvc;

namespace VideoGameCharacterApi.Controllers
{
    [Route("api/characters")]
    [ApiController]
    public class CharacterController : ControllerBase
    {
        private readonly IVideoGameCharacterService _videoGameCharacterService;
    
        public CharacterController(IVideoGameCharacterService videoGameCharacterService)
        {
            _videoGameCharacterService = videoGameCharacterService;
        }
        [HttpGet]
        public async Task<IEnumerable<CharacterModel>> GetCharacters()
        {
            return await _videoGameCharacterService.GetCharacters();
        }
    }
}