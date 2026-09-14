using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Wapp2.Shared.Health;

public sealed class DatabaseHealthCheck(
    IDatabaseHealthProbe databaseHealthProbe
) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            await databaseHealthProbe.CheckAsync(cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy(
                "Database connectivity check failed.",
                exception
            );
        }
    }
}
