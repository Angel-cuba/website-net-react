using Wapp2.Shared.Health;

namespace Wapp2.Tests.TestDoubles;

internal sealed class DatabaseHealthProbeStub : IDatabaseHealthProbe
{
    public Exception? ExceptionToThrow { get; init; }
    public int CheckCallCount { get; private set; }

    public Task CheckAsync(CancellationToken cancellationToken)
    {
        CheckCallCount++;

        return ExceptionToThrow == null
            ? Task.CompletedTask
            : Task.FromException(ExceptionToThrow);
    }
}
