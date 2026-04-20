from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_scenariomaterial_is_packaging'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='default_scenario',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='default_for_products',
                to='api.scenario',
            ),
        ),
        migrations.AddField(
            model_name='scenario',
            name='product',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='scenarios',
                to='api.product',
            ),
        ),
    ]
