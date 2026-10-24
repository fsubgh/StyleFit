const API_URL = 'http://127.0.0.1:8000/api/catalog';
const AUTH_API_URL = 'http://127.0.0.1:8000/api/users';

let allProducts = [];
let selectedGender = 'all';
let bodyTypes = [];

// Элементы каталога
const productList = document.getElementById('product-list');
const productCount = document.getElementById('product-count');
const genderSelect = document.getElementById('gender-select');
const bodyTypeSelect = document.getElementById('body-type-select');
const recommendButton = document.getElementById('recommend-button');
const recommendMessage = document.getElementById('recommend-message');
const recommendationSection = document.getElementById('recommendations-section');
const recommendationList = document.getElementById('recommendation-list');

// Элементы авторизации
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLoginButton = document.getElementById('show-login');
const showRegisterButton = document.getElementById('show-register');
const authMessage = document.getElementById('auth-message');
const authForms = document.getElementById('auth-forms');
const loggedInPanel = document.getElementById('logged-in-panel');
const loggedInUsername = document.getElementById('logged-in-username');
const logoutButton = document.getElementById('logout-button');


// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

async function readResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return { detail: text };
    }
}

function getErrorMessage(data, defaultMessage) {
    if (data.detail) {
        return data.detail;
    }

    if (data.error) {
        return data.error;
    }

    const messages = [];

    Object.values(data).forEach(function (value) {
        if (Array.isArray(value)) {
            messages.push(...value);
        } else if (typeof value === 'string') {
            messages.push(value);
        }
    });

    return messages.length
        ? messages.join(' ')
        : defaultMessage;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (character) {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character];
    });
}

function showAuthMessage(message) {
    if (authMessage) {
        authMessage.textContent = message;
    }
}

function getImageURL(image) {
    if (!image) {
        return '';
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }

    return 'http://127.0.0.1:8000' + image;
}

function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    });
}


// ========================================
// КОРЗИНА
// ========================================


function getCartStorageKey() {
    const username = localStorage.getItem('stylefit-username');

    if (!username) {
        return 'stylefit-cart-guest';
    }

    return 'stylefit-cart-' + username.trim().toLowerCase();
}

function getCart() {
    try {
        const cart = JSON.parse(
            localStorage.getItem(getCartStorageKey()) || '[]'
        );

        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(
        getCartStorageKey(),
        JSON.stringify(cart)
    );

    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);

    const cartCount = document.getElementById('cart-count');

    if (cartCount) {
        cartCount.textContent = count;
    }
}

function addToCart(product) {
    const cart = getCart();

    const existingItem = cart.find(function (item) {
        return item.id === product.id;
    });

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert('Больше товаров нет в наличии.');
            return;
        }

        existingItem.quantity += 1;
    } else {
        if (product.stock <= 0) {
            alert('Этого товара сейчас нет в наличии.');
            return;
        }

        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1
        });
    }

    saveCart(cart);
    alert('Товар добавлен в корзину!');
}


// ========================================
// КАТАЛОГ ТОВАРОВ
// ========================================


function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const imageURL = getImageURL(product.image);
    const productName = escapeHTML(product.name);
    const description = escapeHTML(product.description);
    const category = escapeHTML(product.category_name || 'Одежда');

    let imageContent = '<div class="product-placeholder">SF.</div>';

    if (imageURL) {
        imageContent = `
            <img
                src="${escapeHTML(imageURL)}"
                alt="${productName}"
                loading="lazy"
            >
        `;
    }

    card.innerHTML = `
        <div class="product-visual">
            ${imageContent}
            <span class="product-tag">${category}</span>
        </div>

        <div class="product-details">
            <h3 class="product-title">${productName}</h3>
            <p class="product-description">${description}</p>

            <div class="product-bottom">
                <span class="product-price">
                    ${formatPrice(product.price)}
                </span>

                <button class="add-to-cart" type="button">
                    В корзину
                    <span aria-hidden="true">+</span>
                </button>
            </div>
        </div>
    `;

    const image = card.querySelector('.product-visual img');

    if (image) {
        image.addEventListener('error', function () {
            image.remove();

            const placeholder = document.createElement('div');
            placeholder.className = 'product-placeholder';
            placeholder.textContent = 'SF.';

            card.querySelector('.product-visual').prepend(placeholder);
        });
    }

    card.querySelector('.add-to-cart').addEventListener('click', function () {
        addToCart(product);
    });

    return card;
}


function displayProducts(products, container) {
    container.replaceChildren();

    if (!products || products.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-message';
        message.textContent =
            'Пока здесь нет товаров. Добавь их через панель администратора Django.';

        container.appendChild(message);
        return;
    }

    products.forEach(function (product) {
        container.appendChild(createProductCard(product));
    });
}

function renderCatalog() {
    let filteredProducts = allProducts;

    if (selectedGender !== 'all') {
        filteredProducts = allProducts.filter(function (product) {
            return product.gender === selectedGender ||
                product.gender === 'unisex';
        });
    }

    productCount.textContent = 'Товаров: ' + filteredProducts.length;

    displayProducts(filteredProducts, productList);
}

async function loadProducts() {
    productList.innerHTML =
        '<p class="loading-message">Загружаем товары...</p>';

    try {
        const response = await fetch(API_URL + '/products/');

        if (!response.ok) {
            throw new Error('Не удалось загрузить товары.');
        }

        const data = await response.json();

        allProducts = Array.isArray(data)
            ? data
            : (data.results || []);

        renderCatalog();
    } catch (error) {
        productList.innerHTML = `
            <p class="empty-message">
                Не получилось загрузить каталог.
                Проверь, запущен ли Django на порту 8000.
            </p>
        `;

        productCount.textContent = 'Ошибка загрузки';

        console.error('Ошибка каталога:', error);
    }
}


// ========================================
// ПОДБОР ОДЕЖДЫ
// ========================================

async function loadBodyTypes() {
    const gender = genderSelect.value;

    bodyTypeSelect.innerHTML =
        '<option value="">Загружаем типы фигуры...</option>';

    bodyTypeSelect.disabled = true;

    try {
        const response = await fetch(
            API_URL + '/body-types/?gender=' + encodeURIComponent(gender)
        );

        if (!response.ok) {
            throw new Error('Не удалось загрузить типы фигуры.');
        }

        const data = await response.json();

        bodyTypes = Array.isArray(data)
            ? data
            : (data.results || []);

        bodyTypeSelect.replaceChildren();

        if (bodyTypes.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent =
                'Сначала добавь типы фигуры в админ-панели';

            bodyTypeSelect.appendChild(option);
            return;
        }

        bodyTypes.forEach(function (bodyType) {
            const option = document.createElement('option');
            option.value = bodyType.id;
            option.textContent = bodyType.name;

            bodyTypeSelect.appendChild(option);
        });
    } catch (error) {
        bodyTypeSelect.innerHTML =
            '<option value="">Не удалось загрузить типы фигуры</option>';

        console.error('Ошибка типов фигуры:', error);
    } finally {
        bodyTypeSelect.disabled = false;
    }
}

async function getRecommendations() {
    const gender = genderSelect.value;
    const bodyTypeID = bodyTypeSelect.value;

    if (!bodyTypeID) {
        recommendMessage.textContent =
            'Сначала добавь типы фигуры в админ-панели и выбери один из них.';
        return;
    }

    recommendButton.disabled = true;
    recommendButton.textContent = 'Подбираем...';
    recommendMessage.textContent = 'Ищем товары в каталоге...';

    try {
        const url = API_URL +
            '/recommendations/?gender=' +
            encodeURIComponent(gender) +
            '&body_type_id=' +
            encodeURIComponent(bodyTypeID);

        const response = await fetch(url);
        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                getErrorMessage(data, 'Не удалось получить рекомендации.')
            );
        }

        recommendationSection.hidden = false;

        displayProducts(
            data.recommendations || [],
            recommendationList
        );

        recommendMessage.textContent =
            'Найдено товаров: ' + (data.count ?? 0) + '.';

        recommendationSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    } catch (error) {
        recommendMessage.textContent =
            error.message || 'Не удалось получить подборку. Проверь Django.';

        console.error('Ошибка рекомендаций:', error);
    } finally {
        recommendButton.disabled = false;
        recommendButton.textContent = 'Подобрать одежду';
    }
}


// ========================================
// ВХОД И РЕГИСТРАЦИЯ
// ========================================

function showLoginForm() {
    loginForm.hidden = false;
    registerForm.hidden = true;

    showLoginButton.classList.add('active');
    showRegisterButton.classList.remove('active');

    showAuthMessage('');
}

function showRegisterForm() {
    loginForm.hidden = true;
    registerForm.hidden = false;

    showLoginButton.classList.remove('active');
    showRegisterButton.classList.add('active');

    showAuthMessage('');
}

function showLoggedIn(email) {
    authForms.hidden = true;
    loggedInPanel.hidden = false;

    loggedInUsername.textContent = 'Ты вошла как: ' + email;

    const loginLink = document.querySelector('.login-link');

    if (loginLink) {
        loginLink.textContent = email;
    }
}

function showLoggedOut() {
    localStorage.removeItem('stylefit-access');
    localStorage.removeItem('stylefit-refresh');
    localStorage.removeItem('stylefit-username');

    authForms.hidden = false;
    loggedInPanel.hidden = true;

    const loginLink = document.querySelector('.login-link');

    if (loginLink) {
        loginLink.textContent = 'Войти';
    }

    loginForm.reset();
    registerForm.reset();

    showLoginForm();
}

showLoginButton.addEventListener('click', showLoginForm);
showRegisterButton.addEventListener('click', showRegisterForm);


// ----------------------------------------
// ВХОД ПО ПОЧТЕ И ПАРОЛЮ
// ----------------------------------------

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    showAuthMessage('Проверяем почту и пароль...');

    try {
        const response = await fetch(AUTH_API_URL + '/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                getErrorMessage(
                    data,
                    'Не удалось войти. Проверь почту и пароль.'
                )
            );
        }

        if (!data.access) {
            throw new Error('Сервер не вернул токен входа.');
        }

        localStorage.setItem('stylefit-access', data.access);

        if (data.refresh) {
            localStorage.setItem('stylefit-refresh', data.refresh);
        }

        localStorage.setItem('stylefit-username', email);

        showLoggedIn(email);
        loginForm.reset();

        loggedInUsername.textContent =
            'Вход выполнен успешно! Ты вошла как ' + email;
    } catch (error) {
        showAuthMessage(
            error.message || 'Не удалось связаться с Django.'
        );

        console.error('Ошибка входа:', error);
    }
});


// ----------------------------------------
// РЕГИСТРАЦИЯ
// ----------------------------------------

registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('register-email').value.trim();
    const firstName =
        document.getElementById('register-first-name').value.trim();
    const lastName =
        document.getElementById('register-last-name').value.trim();
    const password =
        document.getElementById('register-password').value;
    const passwordRepeat =
        document.getElementById('register-password-repeat').value;

    // Django User требует логин, поэтому создаём его автоматически.
    const username = email.split('@')[0];

    if (password !== passwordRepeat) {
        showAuthMessage('Пароли не совпадают. Проверь оба поля.');
        return;
    }

    if (password.length < 8) {
        showAuthMessage('Пароль должен содержать минимум 8 символов.');
        return;
    }

    showAuthMessage('Создаём аккаунт...');

    try {
        const response = await fetch(AUTH_API_URL + '/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                first_name: firstName,
                last_name: lastName,
                password: password,
                password_repeat: passwordRepeat
            })
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                getErrorMessage(data, 'Не удалось зарегистрироваться.')
            );
        }

        showAuthMessage('Аккаунт создан! Выполняем вход...');

        const loginResponse = await fetch(AUTH_API_URL + '/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const loginData = await readResponse(loginResponse);

        if (!loginResponse.ok || !loginData.access) {
            showLoginForm();
            showAuthMessage(
                'Аккаунт создан! Теперь войди, указав свою почту и пароль.'
            );

            document.getElementById('login-email').value = email;
            return;
        }

        localStorage.setItem('stylefit-access', loginData.access);

        if (loginData.refresh) {
            localStorage.setItem('stylefit-refresh', loginData.refresh);
        }

        localStorage.setItem('stylefit-username', email);

        registerForm.reset();
        showLoggedIn(email);

        loggedInUsername.textContent =
            'Регистрация прошла успешно! Ты вошла как ' + email;
    } catch (error) {
        showAuthMessage(
            error.message || 'Не удалось связаться с Django.'
        );

        console.error('Ошибка регистрации:', error);
    }
});


// ----------------------------------------
// ВЫХОД
// ----------------------------------------

logoutButton.addEventListener('click', function () {
    showLoggedOut();
    showAuthMessage('Ты вышла из аккаунта.');
});


// Восстановление отображения после перезагрузки
const savedUsername = localStorage.getItem('stylefit-username');
const savedAccessToken = localStorage.getItem('stylefit-access');

if (savedUsername && savedAccessToken) {
    showLoggedIn(savedUsername);
} else {
    showLoginForm();
}


// ========================================
// ЗАПУСК САЙТА
// ========================================

document.querySelectorAll('.filter-button').forEach(function (button) {
    button.addEventListener('click', function () {
        document.querySelectorAll('.filter-button').forEach(function (item) {
            item.classList.remove('active');
        });

        button.classList.add('active');
        selectedGender = button.dataset.gender;

        renderCatalog();
    });
});

genderSelect.addEventListener('change', loadBodyTypes);
recommendButton.addEventListener('click', getRecommendations);

updateCartCount();
loadProducts();
loadBodyTypes();
