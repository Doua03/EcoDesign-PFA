from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_delete_endoflifeproduct'),
    ]

    operations = [
        # Drop the old recommendation table and recreate with full structure
        migrations.DeleteModel(name='Recommendation'),
        migrations.CreateModel(
            name='Recommendation',
            fields=[
                ('id',               models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('scenario',         models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                        related_name='recommendations', to='api.scenario')),
                ('phase',            models.CharField(max_length=50)),
                ('phase_label',      models.CharField(max_length=100)),
                ('current_name',     models.CharField(max_length=255)),
                ('current_co2',      models.FloatField()),
                ('alternative_id',   models.IntegerField()),
                ('alternative_name', models.CharField(max_length=255)),
                ('alternative_co2',  models.FloatField()),
                ('co2_saving',       models.FloatField()),
                ('eco_saving',       models.FloatField()),
                ('improvement_pct',  models.FloatField()),
                ('quantity',         models.FloatField()),
                ('unit',             models.CharField(max_length=50)),
                ('conseil',          models.TextField()),
            ],
            options={'db_table': 'recommendation', 'ordering': ['-co2_saving']},
        ),
    ]
