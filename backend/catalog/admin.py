
from django.contrib import admin
from .models import Category, BodyType, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(BodyType)
class BodyTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'gender')
    list_filter = ('gender',)
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'price',
        'gender',
        'category',
        'stock',
        'is_active',
    )
    list_filter = ('gender', 'category', 'is_active')
    search_fields = ('name', 'description')
    filter_horizontal = ('body_types',)
