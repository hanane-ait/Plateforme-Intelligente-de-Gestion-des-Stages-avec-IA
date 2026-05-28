from django.urls import path
from .views import (
    OfferListCreateView, 
    OfferDetailView, 
    CompanyApplicationsListView,
    StudentApplicationsListView,
    ApplyToOfferView,
    plan_meeting_view,
    RecommendedOffersView
)
from .views import update_application_status
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    # --- OFFRES ---
    # GET (Liste publique) / POST (Création par Entreprise)
    path('', OfferListCreateView.as_view(), name='offer_list_create'),
    # GET / PUT / DELETE (Détail, modification, suppression d'une offre)
    path('<int:pk>/', OfferDetailView.as_view(), name='offer_detail'),
    
    # --- CANDIDATURES ---
    # GET : L'entreprise voit les candidatures reçues
    path('received/', CompanyApplicationsListView.as_view(), name='company_received_applications'),
    # GET : L'étudiant voit ses propres candidatures
    path('my-applications/', StudentApplicationsListView.as_view(), name='student_applications'),
    # POST : L'étudiant postule à une offre spécifique en envoyant son CV PDF
    path('<int:pk>/apply/', ApplyToOfferView.as_view(), name='apply_to_offer'),
    
    # --- ACTIONS ENTREPRISE ---
    # POST : L'entreprise planifie un entretien pour une candidature spécifique (ID de la candidature)
    path('applications/<int:pk>/plan-meeting/', plan_meeting_view, name='plan_meeting'),
    path(
    'recommended/',
    RecommendedOffersView.as_view(),
    name='recommended_offers'
),
    path(
    'applications/<int:pk>/status/',
    update_application_status
),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)