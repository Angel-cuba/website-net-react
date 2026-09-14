using System.Data.Common;
using Dapper;
using Wapp2.Shared.Database;

namespace Wapp2.Shared.Health;

public sealed class SqlDatabaseHealthProbe(
    ISqlConnectionFactory connectionFactory
) : IDatabaseHealthProbe
{
    public async Task CheckAsync(CancellationToken cancellationToken)
    {
        using var connection = connectionFactory.CreateConnection();

        if (connection is DbConnection databaseConnection)
        {
            await databaseConnection.OpenAsync(cancellationToken);
        }
        else
        {
            connection.Open();
        }

        var result = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                "SELECT 1",
                cancellationToken: cancellationToken
            )
        );

        if (result != 1)
        {
            throw new InvalidOperationException(
                "Database probe returned an unexpected result."
            );
        }
    }
}
