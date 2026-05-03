from django.db import migrations, models


def set_eya_pro(apps, schema_editor):
    """Set the 'eya' account to the pro plan."""
    User = apps.get_model('api', 'User')
    User.objects.filter(name__iexact='eya').update(plan='pro')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_scenario_product'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='plan',
            field=models.CharField(
                choices=[
                    ('free',       'Gratuit'),
                    ('pro',        'Pro'),
                    ('enterprise', 'Entreprise'),
                ],
                default='free',
                max_length=20,
            ),
        ),
        migrations.RunPython(set_eya_pro, reverse_code=migrations.RunPython.noop),
    ]
