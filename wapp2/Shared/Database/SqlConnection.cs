using System.Data;
using Microsoft.Data.SqlClient;

namespace Wapp2.Shared.Database;

public class SqlConnectionFactory(IConfiguration config) : ISqlConnectionFactory
{
    public IDbConnection CreateConnection()
    {
        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        return new SqlConnection(connectionString);
    }
}