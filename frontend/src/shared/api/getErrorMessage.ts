import axios from "axios";

// Human-readable Russian messages keyed by HTTP status code.
const STATUS_MESSAGES: Record<number, string> = {
  400: "Неверный запрос",
  401: "Необходимо войти в систему",
  403: "Недостаточно прав для этого действия",
  404: "Запрашиваемые данные не найдены",
  408: "Превышено время ожидания запроса",
  409: "Конфликт данных",
  422: "Неверные данные запроса",
  429: "Слишком много запросов, попробуйте позже",
  500: "Произошла ошибка на сервере",
  502: "Сервер временно недоступен",
  503: "Сервис временно недоступен",
  504: "Сервер не отвечает",
};

const SERVER_ERROR = "Произошла ошибка на сервере";
const GENERIC_ERROR = "Произошла ошибка";
const NETWORK_ERROR = "Не удалось связаться с сервером. Проверьте подключение";

export const getStatusMessage = (status: number): string =>
  STATUS_MESSAGES[status] ?? (status >= 500 ? SERVER_ERROR : GENERIC_ERROR);

/*
 Turns any thrown value into a user-facing Russian message. Priority:
  1. the backend's own `{ error: ... }` response body,
  2. a message mapped from the HTTP status code,
  3. a network/offline message when the request never got a response,
  4. a generic fallback.
*/
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return getStatusMessage(error.response.status);
    }
    return NETWORK_ERROR;
  }
  return GENERIC_ERROR;
};
