from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_existing_meetings(apps, schema_editor):
    Application = apps.get_model('offers', 'Application')
    Interview = apps.get_model('offers', 'Interview')

    for app in Application.objects.filter(meeting_date__isnull=False).select_related('offer'):
        if Interview.objects.filter(application_id=app.id).exists():
            continue
        recruiter = app.offer.company_id
        Interview.objects.create(
            application_id=app.id,
            scheduled_by_id=recruiter,
            scheduled_at=app.meeting_date,
            duration_minutes=60,
            meeting_link=app.meeting_link or f'/meeting/{app.id}',
            notes='',
        )


class Migration(migrations.Migration):

    dependencies = [
        ('offers', '0005_meetingreview'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='application',
            name='meeting_link',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.CreateModel(
            name='Interview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scheduled_at', models.DateTimeField()),
                ('duration_minutes', models.PositiveSmallIntegerField(default=60)),
                ('meeting_link', models.CharField(max_length=500)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='interview', to='offers.application')),
                ('scheduled_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='interviews_scheduled', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['scheduled_at'],
            },
        ),
        migrations.RunPython(migrate_existing_meetings, migrations.RunPython.noop),
    ]
