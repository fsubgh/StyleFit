from django.shortcuts import render


def home(request):
    return render(request, 'index.html')


def cart_page(request):
    return render(request, 'cart.html')