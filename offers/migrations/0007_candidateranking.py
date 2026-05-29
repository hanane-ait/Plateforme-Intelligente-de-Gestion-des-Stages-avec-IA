from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('offers', '0006_interview_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='CandidateRanking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rank', models.PositiveIntegerField()),
                ('justification', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rankings', to='offers.application')),
                ('offer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='candidate_rankings', to='offers.internshipoffer')),
            ],
            options={
                'ordering': ['rank'],
                'unique_together': {('offer', 'application')},
            },
        ),
    ]
