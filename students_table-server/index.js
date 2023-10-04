/* eslint-disable no-console */
// импорт стандартных библиотек Node.js
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');

// файл для базы данных дел
const DB_FILE = './db.json';
// префикс URI для всех методов приложения
const URI_PREFIX = '/api/students';
// номер порта, на котором будет запущен сервер
const PORT = 3000;

/**
 * Класс ошибки, используется для отправки ответа с определённым кодом и описанием ошибки
 */
class StudentsApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Асинхронно считывает тело запроса и разбирает его как JSON
 * @param {Object} req - Объект HTTP запроса
 * @throws {studentsApiError} Некорректные данные в аргументе
 * @returns {Object} Объект, созданный из тела запроса
 */
function drainJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
}

/**
 * Проверяет входные данные и создаёт из них корректный объект дела
 * @param {Object} data - Объект с входными данными
 * @throws {StudentsApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ surname: string, name: string, middleName: string, birthday: string, startDate: string, faculty: string }} Объект дела
 */
function makeStudentsItemFromData(data) {
  const errors = [];

  // составляем объект, где есть только необходимые поля
  const studentsItem = {
    surname: data.surname && String(data.surname),
    name: data.name && String(data.name),
    middleName: data.middleName && String(data.middleName),
    birthday: data.birthday && String(data.birthday),
    startDate: data.startDate && String(data.startDate),
    faculty: data.faculty && String(data.faculty),
  };

  // проверяем, все ли данные корректные и заполняем объект ошибок, которые нужно отдать клиенту
  if (!studentsItem.surname) errors.push({ field: 'surname', message: 'Не указана фамилия' });
  if (!studentsItem.name) errors.push({ field: 'name', message: 'Не указано имя' });
  if (!studentsItem.middleName) errors.push({ field: 'middleName', message: 'Не указано отчество' });
  if (!studentsItem.birthday) errors.push({ field: 'birthday', message: 'Не указана дата рождения' });
  if (!studentsItem.startDate) errors.push({ field: 'startDate', message: 'Не указана дата начала обучения' });
  if (!studentsItem.faculty) errors.push({ field: 'faculty', message: 'Не указан факкультет' });

  // если есть ошибки, то кидаем ошибку с их списком и 422 статусом
  if (errors.length) throw new StudentsApiError(422, { errors });

  return studentsItem;
}

/**
 * Возвращает список дел из базы данных
 * @param {{ owner: string }} [params] - Фильтр по владельцу дела
 * @returns {{ name: string, owner: string, done: boolean }[]} Массив дел
 */
function getStudentsList() {
  const studentsList = JSON.parse(readFileSync(DB_FILE) || '[]');
  return studentsList;
}

/**
 * Создаёт и сохраняет дело в базу данных
 * @throws {StudentsApiError} Некорректные данные в аргументе, дело не создано (statusCode 422)
 * @param {Object} data - Данные из тела запроса
 * @returns {{ name: string, owner: string, done: boolean }} Объект дела
 */
function createStudentsItem(data) {
  const newItem = makeStudentsItemFromData(data);
  newItem.id = Date.now().toString();
  writeFileSync(DB_FILE, JSON.stringify([...getStudentsList(), newItem]), { encoding: 'utf8' });
  return newItem;
}

/**
 * Возвращает объект дела по его ID
 * @param {string} itemId - ID дела
 * @throws {StudentsApiError} Дело с таким ID не найдено (statusCode 404)
 * @returns {{ name: string, owner: string, done?: boolean }} Объект дела
 */
function getStudentsItem(itemId) {
  const studentsItem = getStudentsList().find(({ id }) => id === itemId);
  if (!studentsItem) throw new StudentsApiError(404, { message: 'students Item Not Found' });
  return studentsItem;
}

/**
 * Изменяет дело с указанным ID и сохраняет изменения в базу данных
 * @param {string} itemId - ID изменяемого дела
 * @param {{ name?: string, owner?: string, done?: boolean }} data - Объект с изменяемыми данными
 * @throws {StudentsApiError} Дело с таким ID не найдено (statusCode 404)
 * @throws {StudentsApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ name: string, owner: string, done?: boolean }} Объект дела
 */
function updateStudentsItem(itemId, data) {
  const studentsItems = getStudentsList();
  const itemIndex = studentsItems.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new StudentsApiError(404, { message: 'students Item Not Found' });
  Object.assign(studentsItems[itemIndex], makeStudentsItemFromData({ ...studentsItems[itemIndex], ...data }));
  writeFileSync(DB_FILE, JSON.stringify(studentsItems), { encoding: 'utf8' });
  return studentsItems[itemIndex];
}

/**
 * Удаляет дело из базы данных
 * @param {string} itemId - ID дела
 * @returns {{}}
 */
function deleteStudentsItem(itemId) {
  const studentsItems = getStudentsList();
  const itemIndex = studentsItems.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new StudentsApiError(404, { message: 'students Item Not Found' });
  studentsItems.splice(itemIndex, 1);
  writeFileSync(DB_FILE, JSON.stringify(studentsItems), { encoding: 'utf8' });
  return {};
}

// создаём новый файл с базой данных, если он не существует
if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '[]', { encoding: 'utf8' });

// создаём HTTP сервер, переданная функция будет реагировать на все запросы к нему
createServer(async (req, res) => {
  // req - объект с информацией о запросе, res - объект для управления отправляемым ответом

  // этот заголовок ответа указывает, что тело ответа будет в JSON формате
  res.setHeader('Content-Type', 'application/json');

  // CORS заголовки ответа для поддержки кросс-доменных запросов из браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // запрос с методом OPTIONS может отправлять браузер автоматически для проверки CORS заголовков
  // в этом случае достаточно ответить с пустым телом и этими заголовками
  if (req.method === 'OPTIONS') {
    // end = закончить формировать ответ и отправить его клиенту
    res.end();
    return;
  }

  // если URI не начинается с нужного префикса - можем сразу отдать 404
  if (!req.url || !req.url.startsWith(URI_PREFIX)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  // убираем из запроса префикс URI, разбиваем его на путь и параметры
  const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
  const queryParams = {};

  // параметры могут отсутствовать вообще или иметь вид a=b&b=c
  // во втором случае наполняем объект queryParams { a: 'b', b: 'c' }
  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';
    }
  }

  try {
    // обрабатываем запрос и формируем тело ответа
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        // /api/students
        if (req.method === 'GET') return getStudentsList(queryParams);
        if (req.method === 'POST') {
          const newstudentsItem = createStudentsItem(await drainJson(req));
          res.statusCode = 201;
          res.setHeader('Location', `${URI_PREFIX}/${newstudentsItem.id}`);
          return newstudentsItem;
        }
      } else {
        // /api/students/{id}
        // параметр {id} из URI запроса
        const itemId = uri.substr(1);
        if (req.method === 'GET') return getStudentsItem(itemId);
        if (req.method === 'PATCH') return updateStudentsItem(itemId, await drainJson(req));
        if (req.method === 'DELETE') return deleteStudentsItem(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    // обрабатываем сгенерированную нами же ошибку
    if (err instanceof StudentsApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      // если что-то пошло не так - пишем об этом в консоль и возвращаем 500 ошибку сервера
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server Error' }));
      console.error(err);
    }
  }
})
// выводим инструкцию, как только сервер запустился...
  .on('listening', () => {
    console.log(`Сервер students запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
    console.log('Нажмите CTRL+C, чтобы остановить сервер');
    console.log('Доступные методы:');
    console.log(`GET ${URI_PREFIX} - получить студента из списка, query параметр owner фильтрует по владельцу`);
    console.log(`POST ${URI_PREFIX} - создать запись студента, в теле запроса нужно передать объект { name: string, owner: string, done?: boolean }`);
    console.log(`GET ${URI_PREFIX}/{id} - получить запись студента по его ID`);
    console.log(`PATCH ${URI_PREFIX}/{id} - изменить запись студента с ID, в теле запроса нужно передать объект { name?: string, owner?: string, done?: boolean }`);
    console.log(`DELETE ${URI_PREFIX}/{id} - удалить запись студента по ID`);
  })
// ...и вызываем запуск сервера на указанном порту
  .listen(PORT);
