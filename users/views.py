from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    # On désactive l'authentification sur cette route pour qu'un visiteur anonyme puisse s'inscrire sans 401
    authentication_classes = [] 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user).data,
            "message": "Utilisateur créé avec succès."
        }, status=status.HTTP_201_CREATED)
    

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer