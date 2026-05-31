from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CustomLoginView, UserMeView

urlpatterns = [
    # Attention au '/' à la fin de 'register/'
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Attention au '/' à la fin de 'login/'
   path('login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserMeView.as_view(), name='auth_me'),
]