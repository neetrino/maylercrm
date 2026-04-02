# 🔌 Руководство по интеграции с Meluvis CRM API

**Версия:** 1.0  
**Дата:** 2026-01-19  
**Для:** Внешняя команда разработки

---

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Авторизация](#авторизация)
3. [Базовый URL](#базовый-url)
4. [Список API Endpoints](#список-api-endpoints)
5. [Примеры запросов](#примеры-запросов)
6. [Форматы ответов](#форматы-ответов)
7. [Обработка ошибок](#обработка-ошибок)
8. [Примеры кода](#примеры-кода)

---

## 🚀 Быстрый старт

### Что вам нужно для начала работы:

1. **API Token** - получите у администратора Meluvis CRM
2. **Базовый URL** - URL вашего окружения (staging/production)
3. **Документация** - этот файл + `API-SPECIFICATION.md` для деталей

### Первый запрос (проверка подключения):

```bash
curl -X GET https://your-api-url.com/api/districts \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Если получили список районов - подключение работает! ✅

---

## 🔐 Авторизация

### Bearer Token

**Все запросы к API требуют авторизации через Bearer Token.**

Формат заголовка:
```
Authorization: Bearer YOUR_API_TOKEN
```

**Важно:**
- Токен выдаётся администратором Meluvis CRM
- Храните токен в безопасном месте (переменные окружения, secrets)
- Не коммитьте токен в Git
- При компрометации токена - немедленно сообщите администратору

---

## 🌐 Базовый URL

### Окружения:

**Staging (тестовое):**
```
https://meluvis-crm-staging.vercel.app/api
```

**Production (рабочее):**
```
https://meluvis-crm.vercel.app/api
```

**Development (локальное, только для тестов):**
```
http://localhost:3000/api
```

---

## 📡 Список API Endpoints

### 1. Получить список районов

```
GET /api/districts
```

**Описание:** Получить все доступные районы (districts)

**Авторизация:** Bearer Token (обязательно)

**Параметры:** Нет

**Пример ответа:**
```json
[
  {
    "id": 1,
    "slug": "kentron",
    "name": "Kentron",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  }
]
```

---

### 2. Получить здания по District ID

```
GET /api/districts/{district_id}/buildings
```

**Описание:** Получить все здания в указанном районе

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `district_id` (number, required) - ID района

**Пример запроса:**
```
GET /api/districts/1/buildings
```

**Пример ответа:**
```json
[
  {
    "id": 10,
    "slug": "tower-1",
    "name": "Tower 1",
    "district_id": 1,
    "district_slug": "kentron",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  }
]
```

**Важно:** В ответе есть и `id`, и `slug` для district и building. Используйте `slug` для дальнейших запросов, если нужно.

---

### 3. Получить квартиры по Building ID

```
GET /api/buildings/{building_id}/apartments
```

**Описание:** Получить все квартиры в указанном здании

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `building_id` (number, required) - ID здания

**Query параметры (опционально):**
- `status` (string) - Фильтр по статусу: `upcoming`, `available`, `reserved`, `sold`
- `page` (number) - Номер страницы (по умолчанию: 1)
- `limit` (number) - Количество на странице (по умолчанию: 50, максимум: 100)

**Пример запроса:**
```
GET /api/buildings/10/apartments?status=available&page=1&limit=50
```

**Пример ответа:**
```json
{
  "items": [
    {
      "id": 501,
      "apartment_no": "12-05",
      "apartment_type": 2,
      "status": "available",
      "sqm": 52.4,
      "price_sqm": 650000,
      "total_price": 34060000,
      "total_paid": 0,
      "balance": 34060000,
      "building_id": 10,
      "building_slug": "tower-1",
      "district_id": 1,
      "district_slug": "kentron",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "total_pages": 3
  }
}
```

---

### 4. Получить детали квартиры

```
GET /api/external/apartments/{apartment_id}
```

**Описание:** Получить полную информацию о квартире, включая все поля сделки

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `apartment_id` (number, required) - ID квартиры

**Пример запроса:**
```
GET /api/external/apartments/501
```

**Пример ответа:**
```json
{
  "id": 501,
  "apartment_no": "12-05",
  "apartment_type": 2,
  "status": "available",
  "sqm": 52.4,
  "price_sqm": 650000,
  "total_price": 34060000,
  "total_paid": 0,
  "balance": 34060000,
  "deal_date": null,
  "ownership_name": null,
  "email": null,
  "passport_tax_no": null,
  "phone": null,
  "sales_type": "unsold",
  "deal_description": null,
  "matter_link": null,
  "floorplan_distribution": null,
  "exterior_link": null,
  "exterior_link2": null,
  "building_id": 10,
  "building_slug": "tower-1",
  "building_name": "Tower 1",
  "district_id": 1,
  "district_slug": "kentron",
  "district_name": "Kentron",
  "attachments": {
    "agreement_files": [],
    "floorplans_files": [],
    "images_files": [],
    "progress_images_files": []
  },
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

---

### 5. Обновить статус квартиры

```
PUT /api/apartments/{apartment_id}/status
```

**Описание:** Изменить статус квартиры

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `apartment_id` (number, required) - ID квартиры

**Body:**
```json
{
  "status": "reserved"
}
```

**Валидные значения статуса:**
- `upcoming` - Предстоящая
- `available` - Доступна
- `reserved` - Зарезервирована
- `sold` - Продана

**Пример запроса:**
```
PUT /api/apartments/501/status
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "status": "reserved"
}
```

**Пример ответа:**
```json
{
  "id": 501,
  "status": "reserved",
  "updated_at": "2026-01-19T10:12:00Z"
}
```

---

## 📊 Форматы ответов

### Успешный ответ

Все успешные запросы возвращают JSON с данными.

**Коды успеха:**
- `200 OK` - успешный запрос
- `201 Created` - успешное создание

### Ошибки

**Формат ошибки:**
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

**Коды ошибок:**
- `400 Bad Request` - ошибка валидации (неверные параметры)
- `401 Unauthorized` - не авторизован (неверный или отсутствующий токен)
- `404 Not Found` - ресурс не найден
- `500 Internal Server Error` - ошибка сервера

**Примеры ошибок:**

```json
// 401 - Неверный токен
{
  "error": "Unauthorized"
}

// 404 - Район не найден
{
  "error": "District not found"
}

// 400 - Неверный ID
{
  "error": "Invalid district ID"
}
```

---

## 💻 Примеры кода

### cURL

```bash
# Получить список районов
curl -X GET https://your-api-url.com/api/districts \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Получить здания по District ID
curl -X GET https://your-api-url.com/api/districts/1/buildings \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Получить квартиры по Building ID
curl -X GET "https://your-api-url.com/api/buildings/10/apartments?status=available" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Получить детали квартиры
curl -X GET https://your-api-url.com/api/external/apartments/501 \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Обновить статус квартиры
curl -X PUT https://your-api-url.com/api/apartments/501/status \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "reserved"}'
```

---

### JavaScript / TypeScript (Fetch API)

```javascript
const API_BASE_URL = 'https://your-api-url.com/api';
const API_TOKEN = 'YOUR_API_TOKEN';

// Функция для выполнения запросов
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return await response.json();
}

// Примеры использования:

// 1. Получить список районов
const districts = await apiRequest('/districts');
console.log(districts);

// 2. Получить здания по District ID
const buildings = await apiRequest('/districts/1/buildings');
console.log(buildings);

// 3. Получить квартиры по Building ID
const apartments = await apiRequest('/buildings/10/apartments?status=available');
console.log(apartments.items);

// 4. Получить детали квартиры
const apartment = await apiRequest('/external/apartments/501');
console.log(apartment);

// 5. Обновить статус квартиры
const updated = await apiRequest('/apartments/501/status', {
  method: 'PUT',
  body: JSON.stringify({ status: 'reserved' }),
});
console.log(updated);
```

---

### Python (requests)

```python
import requests

API_BASE_URL = 'https://your-api-url.com/api'
API_TOKEN = 'YOUR_API_TOKEN'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json',
}

# 1. Получить список районов
response = requests.get(f'{API_BASE_URL}/districts', headers=headers)
districts = response.json()
print(districts)

# 2. Получить здания по District ID
response = requests.get(f'{API_BASE_URL}/districts/1/buildings', headers=headers)
buildings = response.json()
print(buildings)

# 3. Получить квартиры по Building ID
params = {'status': 'available', 'page': 1, 'limit': 50}
response = requests.get(f'{API_BASE_URL}/buildings/10/apartments', 
                       headers=headers, params=params)
apartments = response.json()
print(apartments['items'])

# 4. Получить детали квартиры
response = requests.get(f'{API_BASE_URL}/external/apartments/501', headers=headers)
apartment = response.json()
print(apartment)

# 5. Обновить статус квартиры
data = {'status': 'reserved'}
response = requests.put(f'{API_BASE_URL}/apartments/501/status', 
                       headers=headers, json=data)
updated = response.json()
print(updated)
```

---

### PHP (cURL)

```php
<?php

$apiBaseUrl = 'https://your-api-url.com/api';
$apiToken = 'YOUR_API_TOKEN';

function apiRequest($endpoint, $method = 'GET', $data = null) {
    global $apiBaseUrl, $apiToken;
    
    $url = $apiBaseUrl . $endpoint;
    $ch = curl_init($url);
    
    $headers = [
        'Authorization: Bearer ' . $apiToken,
        'Content-Type: application/json',
    ];
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 400) {
        $error = json_decode($response, true);
        throw new Exception($error['error'] ?? 'API request failed');
    }
    
    return json_decode($response, true);
}

// Примеры использования:

// 1. Получить список районов
$districts = apiRequest('/districts');
print_r($districts);

// 2. Получить здания по District ID
$buildings = apiRequest('/districts/1/buildings');
print_r($buildings);

// 3. Получить квартиры по Building ID
$apartments = apiRequest('/buildings/10/apartments?status=available');
print_r($apartments['items']);

// 4. Получить детали квартиры
$apartment = apiRequest('/external/apartments/501');
print_r($apartment);

// 5. Обновить статус квартиры
$updated = apiRequest('/apartments/501/status', 'PUT', ['status' => 'reserved']);
print_r($updated);

?>
```

---

## 🔄 Типичный workflow интеграции

### Шаг 1: Получить список районов
```javascript
const districts = await apiRequest('/districts');
// Сохранить districts для дальнейшего использования
```

### Шаг 2: Для каждого района получить здания
```javascript
for (const district of districts) {
  const buildings = await apiRequest(`/districts/${district.id}/buildings`);
  // Сохранить buildings
}
```

### Шаг 3: Для каждого здания получить квартиры
```javascript
for (const building of buildings) {
  const apartments = await apiRequest(`/buildings/${building.id}/apartments`);
  // Сохранить apartments.items
}
```

### Шаг 4: При необходимости получить детали квартиры
```javascript
const apartmentDetails = await apiRequest(`/external/apartments/${apartment.id}`);
// Использовать полную информацию о квартире
```

### Шаг 5: Обновить статус при необходимости
```javascript
await apiRequest(`/apartments/${apartment.id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'reserved' }),
});
```

---

## ⚠️ Важные замечания

### 1. ID и Slug

**Все ответы содержат и `id`, и `slug` для district и building.**

- Используйте `id` для запросов к API (GET /api/districts/{id}/buildings)
- Используйте `slug` для вашей внутренней логики (если нужно)
- Не проверяйте `id` на вашей стороне - используйте `slug` для идентификации

### 2. Пагинация

При получении списка квартир используйте пагинацию:
```
GET /api/buildings/10/apartments?page=1&limit=50
```

Максимальный `limit`: 100 записей.

### 3. Статусы квартир

Валидные статусы:
- `upcoming` - Предстоящая
- `available` - Доступна
- `reserved` - Зарезервирована
- `sold` - Продана

### 4. Обработка ошибок

Всегда обрабатывайте ошибки:
```javascript
try {
  const data = await apiRequest('/districts');
} catch (error) {
  if (error.message === 'Unauthorized') {
    // Токен неверный или истёк
  } else if (error.message === 'District not found') {
    // Район не найден
  } else {
    // Другая ошибка
  }
}
```

### 5. Rate Limiting

- Рекомендуется: не более 100 запросов в минуту
- При превышении лимита может вернуться ошибка 429

---

## 📞 Поддержка

### Контакты

- **Вопросы по API:** Обратитесь к администратору Meluvis CRM
- **Технические проблемы:** Проверьте логи и формат запросов
- **Изменения в API:** Следите за обновлениями документации

### Дополнительная документация

- **Детальная спецификация:** `API-SPECIFICATION.md`
- **Примеры запросов:** См. раздел "Примеры кода" выше

---

## 📝 Чеклист для начала работы

- [ ] Получен API Token от администратора
- [ ] Определён базовый URL (staging/production)
- [ ] Протестирован первый запрос (GET /api/districts)
- [ ] Настроена обработка ошибок
- [ ] Реализована авторизация (Bearer Token)
- [ ] Протестированы все необходимые endpoints
- [ ] Настроена пагинация (если нужно)
- [ ] Реализована синхронизация данных

---

**Последнее обновление:** 2026-01-19  
**Версия API:** 1.0
