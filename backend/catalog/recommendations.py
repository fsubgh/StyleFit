from .models import Product
from .serializers import ProductSerializer
from django.db import models

def get_recommendations(gender, body_type_id):
    products = Product.objects.filter(
        is_active=True,
        stock__gt=0
    ).filter(
        models.Q(gender=gender) | models.Q(gender='unisex')
    ).prefetch_related(
        'body_types'
    ).select_related(
        'category'
    )

    recommended_products = []

    for product in products:
        for body_type in product.body_types.all():
            if (
                body_type.id == int(body_type_id)
                and body_type.gender == gender
            ):
                recommended_products.append(product)
                break

    serializer = ProductSerializer(
        recommended_products,
        many=True
    )

    return {
        'gender': gender,
        'body_type_id': int(body_type_id),
        'count': len(recommended_products),
        'recommendations': serializer.data
    }