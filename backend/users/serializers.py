from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    password_repeat = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_repeat',
            'first_name',
            'last_name',
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'Пользователь с такой почтой уже зарегистрирован.'
            )

        return value

    def validate(self, data):
        if data['password'] != data['password_repeat']:
            raise serializers.ValidationError({
                'password_repeat': 'Пароли не совпадают.'
            })

        user = User(
            username=data.get('username', ''),
            email=data.get('email', ''),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )

        try:
            validate_password(data['password'], user=user)
        except ValidationError as error:
            raise serializers.ValidationError({
                'password': list(error.messages)
            })

        return data

    def create(self, validated_data):
        validated_data.pop('password_repeat')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        UserProfile.objects.create(user=user)

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    email = serializers.EmailField(
        source='user.email',
        required=False
    )

    first_name = serializers.CharField(
        source='user.first_name',
        required=False,
        allow_blank=True
    )

    last_name = serializers.CharField(
        source='user.last_name',
        required=False,
        allow_blank=True
    )

    class Meta:
        model = UserProfile
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'gender',
            'body_type',
            'birth_date',
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})

        for field, value in user_data.items():
            setattr(instance.user, field, value)

        instance.user.save()

        return super().update(instance, validated_data)

