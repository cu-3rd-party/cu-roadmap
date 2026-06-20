FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build

WORKDIR /src

COPY ["CuRoadmapBackend.csproj", "./"]
RUN dotnet restore "CuRoadmapBackend.csproj"

COPY . .
RUN dotnet publish "CuRoadmapBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final

WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_HTTP_PORTS=8080

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "CuRoadmapBackend.dll"]
