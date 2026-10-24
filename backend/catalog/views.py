from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Category, BodyType, Product
from .serializers import (
    CategorySerializer,
    BodyTypeSerializer,
    ProductSerializer,
)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .recommendations import get_recommendations


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class BodyTypeListView(generics.ListAPIView):
    serializer_class = BodyTypeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = BodyType.objects.all()

        gender = self.request.query_params.get('gender')

        if gender:
            queryset = queryset.filter(gender=gender)

        return queryset


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(
            is_active=True
        ).select_related(
            'category'
        ).prefetch_related(
            'body_types'
        )

        gender = self.request.query_params.get('gender')
        body_type = self.request.query_params.get('body_type')

        if gender:
            queryset = queryset.filter(
                gender__in=[gender, 'unisex']
            )

        if body_type:
            queryset = queryset.filter(
                body_types__id=body_type
            )

        return queryset.distinct()


class RecommendationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        gender = request.query_params.get('gender')
        body_type_id = request.query_params.get('body_type_id')

        if gender not in ['female', 'male']:
            return Response(
                {'error': 'Укажите gender=female или gender=male.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not body_type_id or not body_type_id.isdigit():
            return Response(
                {'error': 'Укажите числовой параметр body_type_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        result = get_recommendations(gender, body_type_id)
        return Response(result)
