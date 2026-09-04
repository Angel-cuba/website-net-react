namespace VideoGameCharacterApi.Models
{
    public class CharacterModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Game { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty; 

        public string Partners { get; set; } = "[]";
        public bool ForEditing { get; set; }
        
         
    }
}