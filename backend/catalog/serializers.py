from rest_framework import serializers
from .models import Category, BodyType, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'description',
        ]


class BodyTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyType
        fields = [
            'id',
            'gender',
            'name',
            'description',
        ]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )

    body_types = BodyTypeSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'gender',
            'category',
            'category_name',
            'body_types',
            'image',
            'sizes',
            'stock',
            'is_active',
            'created_at',
        ]
