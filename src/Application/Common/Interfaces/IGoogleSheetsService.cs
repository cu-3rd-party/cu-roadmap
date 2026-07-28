namespace CuRoadmap.Application.Common.Interfaces;

public interface IGoogleSheetsService
{
    Task SyncAsync(CancellationToken ct = default);
}
