
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class BodyType(models.Model):
    GENDER_CHOICES = [
        ('female', 'Женский'),
        ('male', 'Мужской'),
    ]

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ('gender', 'name')

    def __str__(self):
        return f'{self.get_gender_display()} — {self.name}'


class Product(models.Model):
    GENDER_CHOICES = [
        ('female', 'Женская одежда'),
        ('male', 'Мужская одежда'),
        ('unisex', 'Унисекс'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        default='unisex'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products'
    )
    body_types = models.ManyToManyField(
        BodyType,
        blank=True,
        related_name='products'
    )
    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True
    )
    sizes = models.CharField(max_length=100, blank=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
