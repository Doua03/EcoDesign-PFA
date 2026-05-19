from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_add_ced_eco_scarcity'),
    ]

    operations = [
        migrations.DeleteModel(
            name='EndOfLifeProduct',
        ),
    ]
