from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('web_ui', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='WMSVote',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(max_length=40)),
                ('vote', models.CharField(choices=[('up', 'Thumbs Up'), ('down', 'Thumbs Down')], max_length=4)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='web_ui.wmsservice')),
            ],
            options={
                'unique_together': {('service', 'session_key')},
            },
        ),
    ]
