// Функция для получения cookie по имени
export function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Проверяем, начинается ли cookie с искомого имени
    if (cookie.startsWith(name + '=')) {
      const encodedValue = cookie.substring(name.length + 1);
      // Декодируем значение cookie
      try {
        return decodeURIComponent(encodedValue);
      } catch (e) {
        console.error(`Error decoding cookie ${name}:`, e);
        return encodedValue; // Возвращаем как есть, если декодирование не удалось
      }
    }
  }
  console.log(`Cookie ${name} not found`);
  return null;
}

// Функция для декодирования JWT токена
export function parseJwt(token) {
  try {
    if (!token) {
      console.error('No token provided');
      return null;
    }
    
    // Разделяем токен на части (header, payload, signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }
    
    // Берем payload (вторую часть)
    const base64Url = parts[1];
    
    // Преобразуем base64url в base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Декодируем base64 в строку
    const rawPayload = atob(base64);
    
    // Преобразуем строку в объект JSON
    const payload = JSON.parse(rawPayload);
    
    // Проверяем срок действия токена
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.warn('Token has expired');
      // Можно добавить логику для обновления токена через refresh token
    }
    
    return payload;
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
}

// Функция для получения данных пользователя из токена
export function getUserFromToken() {
  // Сначала пробуем получить токен из cookie
  let token = getCookie('access_token');
  console.log('Retrieved token from cookie:', token ? 'Token exists' : 'No token found in cookie');
  
  // Если токен не найден в cookie, пробуем получить из localStorage
  if (!token) {
    token = localStorage.getItem('access_token');
    console.log('Retrieved token from localStorage:', token ? 'Token exists' : 'No token found in localStorage');
  }
  
  if (!token) return null;
  
  const userData = parseJwt(token);
  console.log('Parsed user data from token:', userData);
  return userData;
}

// Функция для проверки, авторизован ли пользователь
export function isAuthenticated() {
  const userData = getUserFromToken();
  console.log('Authentication check:', userData ? 'User is authenticated' : 'User is not authenticated');
  return !!userData; // Преобразуем в булево значение
}

// Функция для выхода из системы
export function logout() {
  // Удаляем все связанные с аутентификацией cookie
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  document.cookie = 'token_type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  
  // Удаляем токены из localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_type');
  
  console.log('Logged out, tokens removed');
} 