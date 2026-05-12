from django.db import migrations
from django.contrib.auth.hashers import make_password


def add_more_components(apps, schema_editor):
    PriceCategory = apps.get_model('core', 'PriceCategory')
    Component = apps.get_model('core', 'Component')
    Processor = apps.get_model('core', 'Processor')
    Motherboard = apps.get_model('core', 'Motherboard')
    RAM = apps.get_model('core', 'RAM')
    PowerSupply = apps.get_model('core', 'PowerSupply')
    GPU = apps.get_model('core', 'GPU')
    User = apps.get_model('core', 'User')

    budget = PriceCategory.objects.get(category_name='Бюджетная')
    mid = PriceCategory.objects.get(category_name='Средняя')
    premium = PriceCategory.objects.get(category_name='Премиум')

    # ── Processors ──────────────────────────────────────────────────────────────
    # AMD AM4
    c = Component.objects.create(component_name='AMD Ryzen 5 5600X', component_type='processor', price_category=mid, is_required=True)
    Processor.objects.create(component=c, socket='AM4', tdp=65, has_integrated_graphics=False)

    c = Component.objects.create(component_name='AMD Ryzen 7 5800X', component_type='processor', price_category=mid, is_required=True)
    Processor.objects.create(component=c, socket='AM4', tdp=105, has_integrated_graphics=False)

    c = Component.objects.create(component_name='AMD Ryzen 9 5900X', component_type='processor', price_category=premium, is_required=True)
    Processor.objects.create(component=c, socket='AM4', tdp=105, has_integrated_graphics=False)

    # AMD AM5
    c = Component.objects.create(component_name='AMD Ryzen 5 7600X', component_type='processor', price_category=mid, is_required=True)
    Processor.objects.create(component=c, socket='AM5', tdp=105, has_integrated_graphics=True)

    c = Component.objects.create(component_name='AMD Ryzen 7 7700X', component_type='processor', price_category=mid, is_required=True)
    Processor.objects.create(component=c, socket='AM5', tdp=105, has_integrated_graphics=True)

    c = Component.objects.create(component_name='AMD Ryzen 9 7950X', component_type='processor', price_category=premium, is_required=True)
    Processor.objects.create(component=c, socket='AM5', tdp=170, has_integrated_graphics=True)

    # Intel LGA1700 budget
    c = Component.objects.create(component_name='Intel Core i5-12400', component_type='processor', price_category=budget, is_required=True)
    Processor.objects.create(component=c, socket='LGA1700', tdp=65, has_integrated_graphics=True)

    c = Component.objects.create(component_name='Intel Core i9-13900K', component_type='processor', price_category=premium, is_required=True)
    Processor.objects.create(component=c, socket='LGA1700', tdp=125, has_integrated_graphics=True)

    c = Component.objects.create(component_name='Intel Core i9-14900K', component_type='processor', price_category=premium, is_required=True)
    Processor.objects.create(component=c, socket='LGA1700', tdp=125, has_integrated_graphics=True)

    # ── Motherboards ─────────────────────────────────────────────────────────────
    # AMD AM4
    c = Component.objects.create(component_name='ASUS TUF Gaming B550-PLUS', component_type='motherboard', price_category=mid, is_required=True)
    Motherboard.objects.create(component=c, socket='AM4', memory_type='DDR4', memory_slots=4, supports_integrated_graphics=False)

    c = Component.objects.create(component_name='MSI MAG B550 TOMAHAWK', component_type='motherboard', price_category=mid, is_required=True)
    Motherboard.objects.create(component=c, socket='AM4', memory_type='DDR4', memory_slots=4, supports_integrated_graphics=False)

    c = Component.objects.create(component_name='GIGABYTE X570 AORUS Elite', component_type='motherboard', price_category=premium, is_required=True)
    Motherboard.objects.create(component=c, socket='AM4', memory_type='DDR4', memory_slots=4, supports_integrated_graphics=False)

    c = Component.objects.create(component_name='ASRock B450M Pro4', component_type='motherboard', price_category=budget, is_required=True)
    Motherboard.objects.create(component=c, socket='AM4', memory_type='DDR4', memory_slots=4, supports_integrated_graphics=False)

    # AMD AM5
    c = Component.objects.create(component_name='ASUS Prime B650M-A', component_type='motherboard', price_category=mid, is_required=True)
    Motherboard.objects.create(component=c, socket='AM5', memory_type='DDR5', memory_slots=4, supports_integrated_graphics=True)

    c = Component.objects.create(component_name='MSI MAG X670E TOMAHAWK WIFI', component_type='motherboard', price_category=premium, is_required=True)
    Motherboard.objects.create(component=c, socket='AM5', memory_type='DDR5', memory_slots=4, supports_integrated_graphics=True)

    c = Component.objects.create(component_name='GIGABYTE B650 AORUS Elite AX', component_type='motherboard', price_category=mid, is_required=True)
    Motherboard.objects.create(component=c, socket='AM5', memory_type='DDR5', memory_slots=4, supports_integrated_graphics=True)

    # Intel LGA1700 additional
    c = Component.objects.create(component_name='MSI PRO B660M-A DDR4', component_type='motherboard', price_category=budget, is_required=True)
    Motherboard.objects.create(component=c, socket='LGA1700', memory_type='DDR4', memory_slots=4, supports_integrated_graphics=True)

    c = Component.objects.create(component_name='GIGABYTE Z790 AORUS Master', component_type='motherboard', price_category=premium, is_required=True)
    Motherboard.objects.create(component=c, socket='LGA1700', memory_type='DDR5', memory_slots=4, supports_integrated_graphics=True)

    # ── RAM ──────────────────────────────────────────────────────────────────────
    c = Component.objects.create(component_name='Kingston Fury Beast 16GB DDR4', component_type='ram', price_category=budget, is_required=True)
    RAM.objects.create(component=c, memory_type='DDR4', capacity_gb=16, frequency_mhz=3200)

    c = Component.objects.create(component_name='Crucial Ballistix 32GB DDR4', component_type='ram', price_category=mid, is_required=True)
    RAM.objects.create(component=c, memory_type='DDR4', capacity_gb=32, frequency_mhz=3600)

    c = Component.objects.create(component_name='G.Skill Ripjaws V 16GB DDR4', component_type='ram', price_category=budget, is_required=True)
    RAM.objects.create(component=c, memory_type='DDR4', capacity_gb=16, frequency_mhz=3600)

    c = Component.objects.create(component_name='Corsair Vengeance 32GB DDR5', component_type='ram', price_category=mid, is_required=True)
    RAM.objects.create(component=c, memory_type='DDR5', capacity_gb=32, frequency_mhz=5600)

    c = Component.objects.create(component_name='Kingston Fury Beast 64GB DDR5', component_type='ram', price_category=premium, is_required=True)
    RAM.objects.create(component=c, memory_type='DDR5', capacity_gb=64, frequency_mhz=6000)

    c = Component.objects.create(component_name='TeamGroup T-Force 8GB DDR4', component_type='ram', price_category=budget, is_required=True)
    RAM.objects.create(component=c, memory_type='DDR4', capacity_gb=8, frequency_mhz=3000)

    # ── PSU ──────────────────────────────────────────────────────────────────────
    c = Component.objects.create(component_name='Seasonic Focus GX-550', component_type='psu', price_category=budget, is_required=True)
    PowerSupply.objects.create(component=c, wattage=550, efficiency_cert='Gold')

    c = Component.objects.create(component_name='be quiet! System Power 10 500W', component_type='psu', price_category=budget, is_required=True)
    PowerSupply.objects.create(component=c, wattage=500, efficiency_cert='Bronze')

    c = Component.objects.create(component_name='Corsair RM750x', component_type='psu', price_category=mid, is_required=True)
    PowerSupply.objects.create(component=c, wattage=750, efficiency_cert='Gold')

    c = Component.objects.create(component_name='EVGA SuperNOVA 850 G6', component_type='psu', price_category=mid, is_required=True)
    PowerSupply.objects.create(component=c, wattage=850, efficiency_cert='Gold')

    c = Component.objects.create(component_name='Seasonic Prime TX-1000', component_type='psu', price_category=premium, is_required=True)
    PowerSupply.objects.create(component=c, wattage=1000, efficiency_cert='Titanium')

    c = Component.objects.create(component_name='Corsair AX1200i Platinum', component_type='psu', price_category=premium, is_required=True)
    PowerSupply.objects.create(component=c, wattage=1200, efficiency_cert='Platinum')

    # ── GPU ───────────────────────────────────────────────────────────────────────
    c = Component.objects.create(component_name='AMD Radeon RX 6600', component_type='gpu', price_category=mid, is_required=False)
    GPU.objects.create(component=c, power_consumption=132, power_connectors='1x 8-pin')

    c = Component.objects.create(component_name='AMD Radeon RX 6700 XT', component_type='gpu', price_category=mid, is_required=False)
    GPU.objects.create(component=c, power_consumption=230, power_connectors='2x 8-pin')

    c = Component.objects.create(component_name='AMD Radeon RX 7900 XTX', component_type='gpu', price_category=premium, is_required=False)
    GPU.objects.create(component=c, power_consumption=355, power_connectors='3x 8-pin')

    c = Component.objects.create(component_name='NVIDIA GeForce RTX 4060', component_type='gpu', price_category=mid, is_required=False)
    GPU.objects.create(component=c, power_consumption=115, power_connectors='1x 16-pin')

    c = Component.objects.create(component_name='NVIDIA GeForce RTX 4080', component_type='gpu', price_category=premium, is_required=False)
    GPU.objects.create(component=c, power_consumption=320, power_connectors='1x 16-pin')

    c = Component.objects.create(component_name='NVIDIA GeForce RTX 4090', component_type='gpu', price_category=premium, is_required=False)
    GPU.objects.create(component=c, power_consumption=450, power_connectors='3x 8-pin')

    c = Component.objects.create(component_name='AMD Radeon RX 6500 XT', component_type='gpu', price_category=budget, is_required=False)
    GPU.objects.create(component=c, power_consumption=107, power_connectors='1x 8-pin')

    c = Component.objects.create(component_name='NVIDIA GeForce RTX 3050', component_type='gpu', price_category=budget, is_required=False)
    GPU.objects.create(component=c, power_consumption=130, power_connectors='1x 8-pin')

    # Additional regular user
    User.objects.get_or_create(
        login='user',
        defaults=dict(
            password=make_password('user123'),
            role='user',
            is_staff=False,
            is_superuser=False,
            is_active=True,
        )
    )


def remove_more_components(apps, schema_editor):
    Component = apps.get_model('core', 'Component')
    User = apps.get_model('core', 'User')
    extra_names = [
        'AMD Ryzen 5 5600X', 'AMD Ryzen 7 5800X', 'AMD Ryzen 9 5900X',
        'AMD Ryzen 5 7600X', 'AMD Ryzen 7 7700X', 'AMD Ryzen 9 7950X',
        'Intel Core i5-12400', 'Intel Core i9-13900K', 'Intel Core i9-14900K',
        'ASUS TUF Gaming B550-PLUS', 'MSI MAG B550 TOMAHAWK', 'GIGABYTE X570 AORUS Elite',
        'ASRock B450M Pro4', 'ASUS Prime B650M-A', 'MSI MAG X670E TOMAHAWK WIFI',
        'GIGABYTE B650 AORUS Elite AX', 'MSI PRO B660M-A DDR4', 'GIGABYTE Z790 AORUS Master',
        'Kingston Fury Beast 16GB DDR4', 'Crucial Ballistix 32GB DDR4',
        'G.Skill Ripjaws V 16GB DDR4', 'Corsair Vengeance 32GB DDR5',
        'Kingston Fury Beast 64GB DDR5', 'TeamGroup T-Force 8GB DDR4',
        'Seasonic Focus GX-550', 'be quiet! System Power 10 500W', 'Corsair RM750x',
        'EVGA SuperNOVA 850 G6', 'Seasonic Prime TX-1000', 'Corsair AX1200i Platinum',
        'AMD Radeon RX 6600', 'AMD Radeon RX 6700 XT', 'AMD Radeon RX 7900 XTX',
        'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 4080', 'NVIDIA GeForce RTX 4090',
        'AMD Radeon RX 6500 XT', 'NVIDIA GeForce RTX 3050',
    ]
    Component.objects.filter(component_name__in=extra_names).delete()
    User.objects.filter(login='user').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_initial_data'),
    ]

    operations = [
        migrations.RunPython(add_more_components, remove_more_components),
    ]
