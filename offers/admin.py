from django.contrib import admin

from .models import Application, InternshipOffer, Interview, MeetingReview, CandidateRanking


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'application', 'scheduled_at', 'duration_minutes', 'scheduled_by')
    list_filter = ('scheduled_at',)
    search_fields = ('application__student__username', 'notes')


admin.site.register(InternshipOffer)
admin.site.register(Application)
admin.site.register(MeetingReview)
admin.site.register(CandidateRanking)
