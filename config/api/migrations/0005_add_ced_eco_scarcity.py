from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_user_plan'),
    ]

    operations = [
        # Material
        migrations.AddField(model_name='material', name='ced_mj',
            field=models.FloatField(default=0.0)),
        migrations.AddField(model_name='material', name='eco_scarcity',
            field=models.FloatField(default=0.0)),
        # Energy
        migrations.AddField(model_name='energy', name='ced_mj',
            field=models.FloatField(default=0.0)),
        migrations.AddField(model_name='energy', name='eco_scarcity',
            field=models.FloatField(default=0.0)),
        # Transport
        migrations.AddField(model_name='transport', name='ced_mj',
            field=models.FloatField(default=0.0)),
        migrations.AddField(model_name='transport', name='eco_scarcity',
            field=models.FloatField(default=0.0)),
        # Production
        migrations.AddField(model_name='production', name='ced_mj',
            field=models.FloatField(default=0.0)),
        migrations.AddField(model_name='production', name='eco_scarcity',
            field=models.FloatField(default=0.0)),
        # EndOfLife
        migrations.AddField(model_name='endoflife', name='ced_mj',
            field=models.FloatField(default=0.0)),
        migrations.AddField(model_name='endoflife', name='eco_scarcity',
            field=models.FloatField(default=0.0)),
    ]
