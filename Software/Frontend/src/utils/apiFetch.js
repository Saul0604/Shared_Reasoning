/**
 * Utility wrapper around native `fetch` to centralize error handling.
 * Automatically translates network errors and parses backend HTTP exceptions.
 */

export async function apiFetch(url, options = {}) {
  // Read current language from Zustand store persisted in localStorage
  let lang = 'es';
  try {
    const chatStore = JSON.parse(localStorage.getItem('chat-store'));
    if (chatStore && chatStore.state && chatStore.state.language) {
      lang = chatStore.state.language;
    }
  } catch (e) {
    // Ignore parse error
  }

  const getErrorMsg = (esMsg, enMsg) => lang === 'es' ? esMsg : enMsg;

  try {
    const response = await fetch(url, options);

    // Si la respuesta es exitosa (200-299), retornamos la respuesta normal
    if (response.ok) {
      return response;
    }

    // Si no es OK, intentamos leer el "detail" que envía el backend (FastAPI)
    let errorDetail = null;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        // En FastAPI a veces detail es un string, a veces es un array de validaciones
        errorDetail = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      }
    } catch (e) {
      // Ignoramos si no se pudo parsear el JSON
    }

    // Mapeo de errores genéricos si el backend no manda un "detail" descriptivo
    let genericMsg = null;
    switch (response.status) {
      case 401:
        genericMsg = getErrorMsg(
          'Tus credenciales son inválidas o la sesión ha expirado.',
          'Your credentials are invalid or the session has expired.'
        );
        break;
      case 402:
        genericMsg = getErrorMsg(
          'Se requiere un método de pago o tokens.',
          'Payment or tokens are required.'
        );
        break;
      case 403:
        genericMsg = getErrorMsg(
          'No tienes permiso para realizar esta acción o se han agotado tus tokens.',
          'You do not have permission or your tokens are exhausted.'
        );
        break;
      case 404:
        genericMsg = getErrorMsg(
          'El recurso solicitado no fue encontrado.',
          'The requested resource was not found.'
        );
        break;
      case 429:
        genericMsg = getErrorMsg(
          'Demasiadas peticiones. Por favor, espera un momento y vuelve a intentar.',
          'Too many requests. Please wait a moment and try again.'
        );
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        genericMsg = getErrorMsg(
          'El servidor encontró un error inesperado. Estamos trabajando en ello.',
          'The server encountered an unexpected error. We are working on it.'
        );
        break;
      default:
        genericMsg = getErrorMsg(
          `Error inesperado (Código ${response.status}).`,
          `Unexpected error (Code ${response.status}).`
        );
    }

    const finalErrorMsg = errorDetail || genericMsg;
    const customError = new Error(finalErrorMsg);
    customError.status = response.status;
    customError.response = response; // Adjuntamos la respuesta por si el llamador la necesita
    throw customError;

  } catch (error) {
    // Si el error es de red (el backend está caído, problemas de CORS, sin internet)
    if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      const networkError = new Error(
        getErrorMsg(
          'No pudimos conectar con el servidor. Revisa tu conexión a internet o el servidor podría estar apagado.',
          'Could not connect to the server. Check your internet connection or the server might be down.'
        )
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    // Si ya es un error formateado por nosotros u otro error de código, lo lanzamos tal cual
    throw error;
  }
}
