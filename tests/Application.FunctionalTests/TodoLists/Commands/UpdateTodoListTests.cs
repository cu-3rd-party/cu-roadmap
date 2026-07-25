using CuRoadmap.Application.TodoLists;
using CuRoadmap.Domain.Entities;

namespace CuRoadmap.Application.FunctionalTests.TodoLists.Commands;

public class UpdateTodoListTests : TestBase
{
    [Test]
    public async Task ShouldRequireValidTodoListId()
    {
        await TestApp.RunAsDefaultUserAsync();

        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<ITodoListService>();

        await Should.ThrowAsync<NotFoundException>(() => service.UpdateAsync(99, "New Title", null));
    }

    [Test]
    public async Task ShouldUpdateTodoList()
    {
        var userId = await TestApp.RunAsDefaultUserAsync();

        using var scope = FunctionalTestSetup.ScopeFactory.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<ITodoListService>();

        var listId = await service.CreateAsync("New List", null);
        await service.UpdateAsync(listId, "Updated List Title", null);

        var list = await TestApp.FindAsync<TodoList>(listId);
        list.ShouldNotBeNull();
        list!.Title.ShouldBe("Updated List Title");
    }
}
