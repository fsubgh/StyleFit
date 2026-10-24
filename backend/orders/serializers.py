from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem
from catalog.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'quantity',
            'price',
        ]
        read_only_fields = ['price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'full_name',
            'phone',
            'email',
            'address',
            'comment',
            'total_price',
            'status',
            'created_at',
            'items',
        ]
        read_only_fields = [
            'id',
            'total_price',
            'status',
            'created_at',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user

        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                **validated_data
            )

            total = 0

            for item_data in items_data:
                product = Product.objects.select_for_update().get(
                    id=item_data['product'].id
                )
                quantity = item_data['quantity']

                if not product.is_active:
                    raise serializers.ValidationError(
                        f'Товар «{product.name}» недоступен.'
                    )

                if quantity < 1 or product.stock < quantity:
                    raise serializers.ValidationError(
                        f'Недостаточно товара «{product.name}» на складе.'
                    )

                price = product.price

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=price,
                )

                product.stock -= quantity
                product.save(update_fields=['stock'])

                total += price * quantity

            order.total_price = total
            order.save(update_fields=['total_price'])

        return order
