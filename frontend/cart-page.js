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
    renderCart();
}

function updateCartCount() {
    const count = getCart().reduce(function (sum, item) {
        return sum + Number(item.quantity || 0);
    }, 0);

    const badge = document.getElementById('cart-count');

    if (badge) {
        badge.textContent = count;
    }
}

function showCartMessage(message, isError = false) {
    const element = document.getElementById('cart-message');

    element.textContent = message;
    element.className = isError
        ? 'cart-message error'
        : 'cart-message success';
}

function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU') + ' ₽';
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');

    container.replaceChildren();

    if (cart.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-cart';
        message.textContent = 'Корзина пока пуста. Выбери товары в каталоге.';
        container.appendChild(message);

        totalElement.textContent = formatPrice(0);
        checkoutButton.disabled = true;
        return;
    }

    checkoutButton.disabled = false;

    let total = 0;

    cart.forEach(function (item) {
        const price = Number(item.price);
        const quantity = Number(item.quantity);
        total += price * quantity;

        const card = document.createElement('article');
        card.className = 'cart-item';

        const info = document.createElement('div');
        info.className = 'cart-item-info';

        const name = document.createElement('h3');
        name.textContent = item.name;

        const priceText = document.createElement('p');
        priceText.textContent = formatPrice(price) + ' за штуку';

        const quantityControls = document.createElement('div');
        quantityControls.className = 'quantity-controls';

        const minus = document.createElement('button');
        minus.type = 'button';
        minus.textContent = '−';
        minus.setAttribute('aria-label', 'Уменьшить количество');

        minus.addEventListener('click', function () {
            const updatedCart = getCart();
            const found = updatedCart.find(
                product => String(product.id) === String(item.id)
            );

            if (!found) return;

            found.quantity -= 1;

            if (found.quantity <= 0) {
                saveCart(updatedCart.filter(
                    product => String(product.id) !== String(item.id)
                ));
            } else {
                saveCart(updatedCart);
            }
        });

        const quantityText = document.createElement('span');
        quantityText.textContent = quantity;

        const plus = document.createElement('button');
        plus.type = 'button';
        plus.textContent = '+';
        plus.setAttribute('aria-label', 'Увеличить количество');

        plus.addEventListener('click', function () {
            const updatedCart = getCart();
            const found = updatedCart.find(
                product => String(product.id) === String(item.id)
            );

            if (!found) return;

            if (found.quantity >= Number(found.stock || 999999)) {
                showCartMessage('Больше товаров нет в наличии.', true);
                return;
            }

            found.quantity += 1;
            saveCart(updatedCart);
        });

        const itemTotal = document.createElement('strong');
        itemTotal.textContent = formatPrice(price * quantity);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-item';
        remove.textContent = 'Удалить';

        remove.addEventListener('click', function () {
            saveCart(getCart().filter(
                product => String(product.id) !== String(item.id)
            ));
        });

        quantityControls.append(minus, quantityText, plus);
        info.append(name, priceText, quantityControls, itemTotal, remove);
        card.appendChild(info);
        container.appendChild(card);
    });

    totalElement.textContent = formatPrice(total);
}

async function loadMyOrders() {
    const token = localStorage.getItem('stylefit-access');
    const container = document.getElementById('my-orders');

    if (!token) {
        container.textContent =
            'Войди в аккаунт, чтобы увидеть свои заказы.';
        return;
    }

    try {
        const response = await fetch('/api/orders/', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить заказы.');
        }

        const orders = await response.json();
        container.replaceChildren();

        if (orders.length === 0) {
            container.textContent = 'У тебя пока нет заказов.';
            return;
        }

        orders.forEach(function (order) {
            const card = document.createElement('article');
            card.className = 'order-card';

            const title = document.createElement('h3');
            title.textContent = 'Заказ №' + order.id;

            const status = document.createElement('p');
            const statusNames = {
                new: 'Новый',
                processing: 'В обработке',
                shipped: 'Отправлен',
                completed: 'Выполнен',
                cancelled: 'Отменён'
            };
            status.textContent =
                'Статус: ' + (statusNames[order.status] || order.status);

            const total = document.createElement('p');
            total.textContent = 'Сумма: ' + formatPrice(order.total_price);

            const date = document.createElement('p');
            date.textContent = 'Создан: ' +
                new Date(order.created_at).toLocaleString('ru-RU');

            card.append(title, status, total, date);
            container.appendChild(card);
        });
    } catch (error) {
        container.textContent = error.message;
    }
}

document.getElementById('checkout-form').addEventListener(
    'submit',
    async function (event) {
        event.preventDefault();

        const token = localStorage.getItem('stylefit-access');
        const cart = getCart();

        if (!token) {
            showCartMessage(
                'Сначала войди в аккаунт, чтобы оформить заказ.',
                true
            );
            return;
        }

        if (cart.length === 0) {
            showCartMessage('Корзина пуста.', true);
            return;
        }

        const form = event.currentTarget;
        const button = document.getElementById('checkout-button');
        const formData = new FormData(form);

        const city = String(formData.get('city')).trim();
        const address = String(formData.get('address')).trim();

        const orderData = {
            full_name: String(formData.get('full_name')).trim(),
            phone: String(formData.get('phone')).trim(),
            email: String(formData.get('email')).trim(),
            address: city + ', ' + address,
            comment: String(formData.get('comment') || '').trim(),
            items: cart.map(function (item) {
                return {
                    product: Number(item.id),
                    quantity: Number(item.quantity)
                };
            })
        };

        button.disabled = true;
        button.textContent = 'Оформляем заказ...';

        try {
            const response = await fetch('/api/orders/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (!response.ok) {
                const message = typeof data === 'object'
                    ? JSON.stringify(data)
                    : String(data);

                throw new Error(message);
            }

            localStorage.setItem(getCartStorageKey(), '[]');
            updateCartCount();
            renderCart();
            form.reset();

            showCartMessage(
                'Заказ №' + data.id + ' успешно оформлен!'
            );

            await loadMyOrders();
        } catch (error) {
            showCartMessage(
                'Не удалось оформить заказ: ' + error.message,
                true
            );
        } finally {
            button.disabled = false;
            button.textContent = 'Подтвердить заказ';
        }
    }
);

document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    renderCart();
    loadMyOrders();
});