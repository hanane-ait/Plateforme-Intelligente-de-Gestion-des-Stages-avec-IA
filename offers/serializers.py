from rest_framework import serializers
from .models import InternshipOffer, Application

class InternshipOfferSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.username') # Récupère le nom de l'entreprise
    
    # 💡 Champ dynamique calculé par la vue RecommendedOffersView pour l'étudiant
    matching_score = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = InternshipOffer
        fields = '__all__'
        read_only_fields = ['company']


class ApplicationSerializer(serializers.ModelSerializer):
    # Ce champ personnalisé renvoie les détails textuels pour le dashboard React
    offer_details = serializers.SerializerMethodField(read_only=True)
    
    # Récupère directement le username de l'étudiant pour l'affichage côté entreprise
    student_username = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = Application
        fields = [
            'id', 'offer', 'student', 'student_username', 'cv_file', 
            'cover_letter', 'status', 'applied_at', 'offer_details',
            
            # 🤖 Nouveaux champs pour l'analyse automatique du CV par l'IA
            'ai_matching_score', 'ai_analysis_summary',
            
            # 🗓️ Nouveaux champs pour la planification de la réunion
            'meeting_date', 'meeting_link'
        ]
        read_only_fields = [
            'student', 'status', 'ai_matching_score', 
            'ai_analysis_summary', 'meeting_date', 'meeting_link'
        ]

    def get_offer_details(self, obj):
        return {
            "title": obj.offer.title,
            "company_name": obj.offer.company.username,
        }