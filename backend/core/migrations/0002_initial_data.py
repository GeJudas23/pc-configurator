from django.db import migrations
from django.contrib.auth.hashers import make_password


def load_initial_data(apps, schema_editor):
    PriceCategory = apps.get_model('core', 'PriceCategory')
    Component = apps.get_model('core', 'Component')
    Processor = apps.get_model('core', 'Processor')
    Motherboard = apps.get_model('core', 'Motherboard')
    RAM = apps.get_model('core', 'RAM')
    PowerSupply = apps.get_model('core', 'PowerSupply')
    GPU = apps.get_model('core', 'GPU')
    User = apps.get_model('core', 'User')

    budget = PriceCategory.objects.create(
        category_name='Бюджетная', min_price=30000, max_price=50000,
        description='Оптимальный выбор для повседневных задач',
    )
    mid = PriceCategory.objects.create(
        category_name='Средняя', min_price=50000, max_price=100000,
        description='Баланс производительности и цены',
    )
    premium = PriceCategory.objects.create(
        category_name='Премиум', min_price=100000, max_price=None,
        description='Максимальная производительность без компромиссов',
    )

    # Processors
    c1 = Component.objects.create(component_name='Intel Core i3-12100', component_type='processor', price_category=budget, is_required=True)
    Processor.objects.create(component=c1, socket='LGA1700', tdp=60, has_integrated_graphics=True)

    c2 = Component.objects.create(component_name='Intel Core i5-13400', component_type='processor', price_category=mid, is_required=True)
    Processor.objects.create(component=c2, socket='LGA1700', tdp=65, has_integrated_graphics=True)

    c3 = Component.objects.create(component_name='Intel Core i7-13700K', component_type='processor', price_category=premium, is_required=True)
    Processor.objects.create(component=c3, socket='LGA1700', tdp=125, has_integrated_graphics=True)

    # Motherboards
    c4 = Component.objects.create(component_name='ASUS Prime H610M-K', component_type='motherboard', price_category=budget, is_required=True)
    Motherboard.objects.create(component=c4, socket='LGA1700', memory_type='DDR4', memory_slots=2, supports_integrated_graphics=True)

    c5 = Component.objects.create(component_name='MSI B760M Pro-A', component_type='motherboard', price_category=mid, is_required=True)
    Motherboard.objects.create(component=c5, socket='LGA1700', memory_type='DDR5', memory_slots=4, supports_integrated_graphics=True)

    c6 = Component.objects.create(component_name='ASUS ROG STRIX Z790-E', component_type='motherboard', price_category=premium, is_required=True)
    Motherboard.objects.create(component=c6, socket='LGA1700', memory_type='DDR5', memory_slots=4, supports_integrated_graphics=True)

    # RAM
    c7 = Component.objects.create(component_name='Kingston Fury Beast 8GB DDR4', component_type='ram', price_category=budget, is_required=True)
    RAM.objects.create(component=c7, memory_type='DDR4', capacity_gb=8, frequency_mhz=3200)

    c8 = Component.objects.create(component_name='Corsair Vengeance 16GB DDR5', component_type='ram', price_category=mid, is_required=True)
    RAM.objects.create(component=c8, memory_type='DDR5', capacity_gb=16, frequency_mhz=5200)

    c9 = Component.objects.create(component_name='G.Skill Trident Z5 32GB DDR5', component_type='ram', price_category=premium, is_required=True)
    RAM.objects.create(component=c9, memory_type='DDR5', capacity_gb=32, frequency_mhz=6000)

    # PSU
    c10 = Component.objects.create(component_name='Seasonic Focus GX-450', component_type='psu', price_category=budget, is_required=True)
    PowerSupply.objects.create(component=c10, wattage=450, efficiency_cert='Gold')

    c11 = Component.objects.create(component_name='be quiet! Pure Power 12 650W', component_type='psu', price_category=mid, is_required=True)
    PowerSupply.objects.create(component=c11, wattage=650, efficiency_cert='Gold')

    c12 = Component.objects.create(component_name='Corsair HX850 Platinum', component_type='psu', price_category=premium, is_required=True)
    PowerSupply.objects.create(component=c12, wattage=850, efficiency_cert='Platinum')

    # GPU
    c13 = Component.objects.create(component_name='NVIDIA GeForce RTX 3060', component_type='gpu', price_category=mid, is_required=False)
    GPU.objects.create(component=c13, power_consumption=170, power_connectors='1x 16-pin')

    c14 = Component.objects.create(component_name='NVIDIA GeForce RTX 4070 Ti', component_type='gpu', price_category=premium, is_required=False)
    GPU.objects.create(component=c14, power_consumption=285, power_connectors='2x 16-pin')

    # Admin user
    User.objects.create(
        login='admin',
        password=make_password('admin123'),
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True,
    )


def remove_initial_data(apps, schema_editor):
    PriceCategory = apps.get_model('core', 'PriceCategory')
    User = apps.get_model('core', 'User')
    PriceCategory.objects.all().delete()
    User.objects.filter(login='admin').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(load_initial_data, remove_initial_data),
    ]
