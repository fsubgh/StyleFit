from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from .models import UserProfile
from catalog.models import BodyType


class UserProfileModelTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPassword123!'
        )

    def test_profile_creation(self):
        profile = UserProfile.objects.create(user=self.user)

        self.assertEqual(profile.user, self.user)

    def test_profile_str(self):
        profile = UserProfile.objects.create(user=self.user)

        self.assertEqual(str(profile), 'Профиль: testuser')

    def test_profile_body_type(self):
        profile = UserProfile.objects.create(user=self.user)

        body_type = BodyType.objects.create(
            gender='female',
            name='Песочные часы'
        )

        profile.body_type = body_type
        profile.save()

        self.assertEqual(profile.body_type, body_type)


class UserAPITests(APITestCase):

    def setUp(self):
        self.register_url = '/api/users/register/'
        self.login_url = '/api/users/login/'
        self.profile_url = '/api/users/profile/'

        self.user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPassword123!',
            'password_repeat': 'StrongPassword123!',
            'first_name': 'Иван',
            'last_name': 'Иванов',
        }

    def test_user_registration(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username='newuser').exists()
        )

    def test_user_login(self):
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPassword123!'
        )

        response = self.client.post(
            self.login_url,
            {
                'email': 'test@example.com',
                'password': 'StrongPassword123!'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_wrong_password(self):
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPassword123!'
        )

        response = self.client.post(
            self.login_url,
            {
                'email': 'test@example.com',
                'password': 'WrongPassword123!'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]
        )

    def test_authenticated_user_can_view_profile(self):
        user = User.objects.create_user(
            username='profileuser',
            email='profile@example.com',
            password='StrongPassword123!'
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'profileuser')