using System.Data;

namespace Wapp2.Shared.Database;

public interface ISqlConnectionFactory
{
    IDbConnection CreateConnection();
}
