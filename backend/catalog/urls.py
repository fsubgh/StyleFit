from django.urls import path

from .views import (
    CategoryListView,
    BodyTypeListView,
    ProductListView,
    RecommendationView,
)


urlpatterns = [
    path(
        'categories/',
        CategoryListView.as_view(),
        name='categories'
    ),
    path(
        'body-types/',
        BodyTypeListView.as_view(),
        name='body-types'
    ),
    path(
        'products/',
        ProductListView.as_view(),
        name='products'
    ),
    path(
        'recommendations/',
        RecommendationView.as_view(),
        name='recommendations'
    ),
]

