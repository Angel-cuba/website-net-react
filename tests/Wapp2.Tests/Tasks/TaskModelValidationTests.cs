using System.ComponentModel.DataAnnotations;
using Tasks.Models;

namespace Wapp2.Tests.Tasks;

public class TaskModelValidationTests
{
    [Fact]
    public void Title_FromProductionRegression_IsValid()
    {
        var task = CreateValidTask();
        task.Title = "The more backend development I do, the less I think of an API as just a collection of endpoints.";

        var validationResults = Validate(task);

        Assert.Empty(validationResults);
    }

    [Fact]
    public void Title_WhenLongerThan150Characters_IsRejected()
    {
        var task = CreateValidTask();
        task.Title = new string('a', 151);

        var validationResults = Validate(task);

        var result = Assert.Single(validationResults);
        Assert.Contains(nameof(TaskModel.Title), result.MemberNames);
    }

    private static TaskModel CreateValidTask()
    {
        return new TaskModel
        {
            Title = "Valid task",
            Category = "Backend",
            Description = "A valid task description.",
            Priority = "High",
            Status = "in-progress"
        };
    }

    private static List<ValidationResult> Validate(TaskModel task)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(
            task,
            new ValidationContext(task),
            results,
            validateAllProperties: true
        );
        return results;
    }
}
