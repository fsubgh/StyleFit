from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'phone',
        'gender',
        'body_type',
        'created_at',
    )

    list_filter = ('gender',)
    search_fields = ('user__username', 'phone')
