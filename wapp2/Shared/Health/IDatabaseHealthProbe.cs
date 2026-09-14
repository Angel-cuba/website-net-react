namespace Wapp2.Shared.Health;

public interface IDatabaseHealthProbe
{
    Task CheckAsync(CancellationToken cancellationToken);
}
