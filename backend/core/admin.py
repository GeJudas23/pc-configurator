from django.contrib import admin
from .models import PriceCategory, Component, Processor, Motherboard, RAM, PowerSupply, GPU, Incompatibility

admin.site.register(PriceCategory)
admin.site.register(Component)
admin.site.register(Processor)
admin.site.register(Motherboard)
admin.site.register(RAM)
admin.site.register(PowerSupply)
admin.site.register(GPU)
admin.site.register(Incompatibility)
