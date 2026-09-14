namespace Wapp2.Tests.TestDoubles;

internal sealed class FixedTimeProvider(
    DateTimeOffset utcNow
) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => utcNow;
}
