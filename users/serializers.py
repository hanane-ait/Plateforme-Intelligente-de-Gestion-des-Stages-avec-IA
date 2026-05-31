from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, CompanyProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'telephone']


class UserUpdateSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'role', 'telephone', 'company_name']

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_role(self, value):
        if value not in ('STUDENT', 'COMPANY'):
            raise serializers.ValidationError(
                "Seuls les rôles Étudiant et Entreprise peuvent être sélectionnés."
            )
        return value

    def validate(self, attrs):
        new_role = attrs.get('role', self.instance.role)
        company_name = (attrs.get('company_name') or '').strip()
        has_company_profile = hasattr(self.instance, 'company_profile')

        if new_role == 'COMPANY' and not has_company_profile and not company_name:
            raise serializers.ValidationError({
                'company_name': "Indiquez le nom de l'entreprise pour ce rôle."
            })
        return attrs

    def update(self, instance, validated_data):
        company_name = (validated_data.pop('company_name', None) or '').strip()
        old_role = instance.role

        instance = super().update(instance, validated_data)
        new_role = instance.role

        if new_role == 'STUDENT':
            StudentProfile.objects.get_or_create(user=instance)
        elif new_role == 'COMPANY':
            profile, created = CompanyProfile.objects.get_or_create(
                user=instance,
                defaults={'company_name': company_name or instance.username},
            )
            if not created and company_name:
                profile.company_name = company_name
                profile.save(update_fields=['company_name'])

        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Optionnel selon le rôle choisi à l'inscription
    company_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'telephone', 'company_name']

    def validate(self, attrs):
        # Si le rôle est entreprise, le nom de l'entreprise est obligatoire
        if attrs.get('role') == 'COMPANY' and not attrs.get('company_name'):
            raise serializers.ValidationError({"company_name": "Le nom de l'entreprise est requis pour ce rôle."})
        return attrs

    def create(self, validated_data):
        company_name = validated_data.pop('company_name', None)
        
        # Création de l'utilisateur avec mot de passe haché sécurisé
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            telephone=validated_data.get('telephone', '')
        )
        
        # Création automatique du profil associé selon le rôle
        if user.role == 'STUDENT':
            StudentProfile.objects.create(user=user)
        elif user.role == 'COMPANY':
            CompanyProfile.objects.create(user=user, company_name=company_name)
            
        return user
    
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Ajouter le rôle dans le token
        token['role'] = user.role
        token['username'] = user.username

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Ajouter les infos utilisateur dans la réponse login
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
        }

        return data