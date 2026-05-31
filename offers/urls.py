from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from .views import (
    OfferListCreateView,
    OfferDetailView,
    CompanyApplicationsListView,
    StudentApplicationsListView,
    ApplyToOfferView,
    RecommendedOffersView,
)
from .views import (
    plan_meeting_view,
    update_application_status,
    cancel_application,
    generate_cover_letter_view,
    rank_candidates_view,
    analyze_meeting_text_view,
    analyze_meeting_audio_view,
    analyze_meeting_pdf_view,
    student_dashboard_stats_view,
    company_dashboard_stats_view,
    assistant_chat_view,
)

urlpatterns = [
    # --- OFFRES ---
    path('', OfferListCreateView.as_view(), name='offer_list_create'),
    path('<int:pk>/', OfferDetailView.as_view(), name='offer_detail'),

    # --- CANDIDATURES ---
    path('received/', CompanyApplicationsListView.as_view(), name='company_received_applications'),
    path('my-applications/', StudentApplicationsListView.as_view(), name='student_applications'),
    path('<int:pk>/apply/', ApplyToOfferView.as_view(), name='apply_to_offer'),

    # --- RECOMMANDATIONS IA ---
    path('recommended/', RecommendedOffersView.as_view(), name='recommended_offers'),

    # --- LETTRE DE MOTIVATION IA ---
    path('<int:pk>/generate-cover-letter/', generate_cover_letter_view, name='generate_cover_letter'),

    # --- ACTIONS ENTREPRISE ---
    path('applications/<int:pk>/plan-meeting/', plan_meeting_view, name='plan_meeting'),
    path('applications/<int:pk>/status/', update_application_status, name='update_status'),
    path('applications/<int:pk>/cancel/', cancel_application, name='cancel_application'),

    # --- CLASSEMENT CANDIDATS IA (ENTREPRISE) ---
    path('stats/student/', student_dashboard_stats_view, name='student_dashboard_stats'),
    path('stats/company/', company_dashboard_stats_view, name='company_dashboard_stats'),
    path('assistant/chat/', assistant_chat_view, name='assistant_chat'),
    path('<int:pk>/rank-candidates/', rank_candidates_view, name='rank_candidates'),

    # --- ANALYSE POST-ENTRETIEN ---
    path('applications/<int:pk>/analyze-meeting/', analyze_meeting_text_view, name='analyze_meeting_text'),
    path('applications/<int:pk>/analyze-meeting-audio/', analyze_meeting_audio_view, name='analyze_meeting_audio'),
    path('applications/<int:pk>/analyze-meeting-pdf/', analyze_meeting_pdf_view, name='analyze_meeting_pdf'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)