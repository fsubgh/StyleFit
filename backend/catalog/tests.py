
from django.test import TestCase
from decimal import Decimal

from .models import Category, BodyType, Product


class CategoryTest(TestCase):

    def test_create_category(self):
        category = Category.objects.create(
            name='Платья',
            description='Женская одежда'
        )

        self.assertEqual(category.name, 'Платья')
        self.assertEqual(str(category), 'Платья')


class BodyTypeTest(TestCase):

    def test_create_body_type(self):
        body_type = BodyType.objects.create(
            gender='female',
            name='Песочные часы',
            description='Тип женской фигуры'
        )

        self.assertEqual(body_type.gender, 'female')
        self.assertEqual(body_type.name, 'Песочные часы')

    def test_body_type_gender_display(self):
        body_type = BodyType.objects.create(
            gender='female',
            name='Груша'
        )

        self.assertEqual(
            body_type.get_gender_display(),
            'Женский'
        )

    def test_body_type_str(self):
        body_type = BodyType.objects.create(
            gender='male',
            name='Треугольник'
        )

        self.assertEqual(
            str(body_type),
            'Мужской — Треугольник'
        )


class ProductTest(TestCase):

    def setUp(self):
        self.category = Category.objects.create(
            name='Футболки'
        )

        self.body_type = BodyType.objects.create(
            gender='female',
            name='Песочные часы'
        )

        self.product = Product.objects.create(
            name='Базовая футболка',
            description='Повседневная футболка',
            price=Decimal('1499.00'),
            gender='female',
            category=self.category,
            stock=10
        )

    def test_create_product(self):
        self.assertEqual(
            self.product.name,
            'Базовая футболка'
        )

        self.assertEqual(
            self.product.price,
            Decimal('1499.00')
        )

    def test_product_defaults(self):
        self.assertTrue(self.product.is_active)
        self.assertEqual(self.product.stock, 10)
        self.assertEqual(self.product.gender, 'female')
        self.assertIsNotNone(self.product.created_at)

    def test_add_body_type_to_product(self):
        self.product.body_types.add(self.body_type)

        self.assertIn(
            self.body_type,
            self.product.body_types.all()
        )

    def test_product_category_relationship(self):
        self.assertEqual(
            self.product.category.name,
            'Футболки'
        )
