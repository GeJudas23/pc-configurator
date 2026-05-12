from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import (
    PriceCategory, Component, Processor, Motherboard, RAM,
    PowerSupply, GPU, Incompatibility, User, Build, History,
)


class PriceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceCategory
        fields = ['id', 'category_name', 'min_price', 'max_price', 'description']


class ProcessorDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Processor
        fields = ['socket', 'tdp', 'has_integrated_graphics']


class MotherboardDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motherboard
        fields = ['socket', 'memory_type', 'memory_slots', 'supports_integrated_graphics']


class RAMDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = RAM
        fields = ['memory_type', 'capacity_gb', 'frequency_mhz']


class PowerSupplyDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PowerSupply
        fields = ['wattage', 'efficiency_cert']


class GPUDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPU
        fields = ['power_consumption', 'power_connectors']


_DETAIL_MODELS = {
    'processor': Processor,
    'motherboard': Motherboard,
    'ram': RAM,
    'psu': PowerSupply,
    'gpu': GPU,
}

_DETAIL_SERIALIZERS = {
    'processor': ProcessorDetailSerializer,
    'motherboard': MotherboardDetailSerializer,
    'ram': RAMDetailSerializer,
    'psu': PowerSupplyDetailSerializer,
    'gpu': GPUDetailSerializer,
}


class ComponentSerializer(serializers.ModelSerializer):
    price_category = PriceCategorySerializer(read_only=True)
    price_category_id = serializers.PrimaryKeyRelatedField(
        queryset=PriceCategory.objects.all(), source='price_category', write_only=True
    )
    details = serializers.SerializerMethodField()
    detail_data = serializers.JSONField(write_only=True, required=False, default=dict)

    class Meta:
        model = Component
        fields = [
            'id', 'component_name', 'component_type',
            'price_category', 'price_category_id',
            'is_required', 'date_added', 'date_modified',
            'details', 'detail_data',
        ]
        read_only_fields = ['date_added', 'date_modified']

    def get_details(self, obj):
        detail = obj.get_detail()
        if detail is None:
            return None
        ser_class = _DETAIL_SERIALIZERS.get(obj.component_type)
        return ser_class(detail).data if ser_class else None

    def create(self, validated_data):
        detail_data = validated_data.pop('detail_data', {})
        component = super().create(validated_data)
        Model = _DETAIL_MODELS.get(component.component_type)
        if Model and detail_data:
            Model.objects.create(component=component, **detail_data)
        return component

    def update(self, instance, validated_data):
        detail_data = validated_data.pop('detail_data', {})
        component = super().update(instance, validated_data)
        if detail_data:
            Model = _DETAIL_MODELS.get(component.component_type)
            if Model:
                Model.objects.filter(component=component).update(**detail_data)
        return component


class ProcessorSerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)

    class Meta:
        model = Processor
        fields = ['id', 'component', 'socket', 'tdp', 'has_integrated_graphics']


class MotherboardSerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)

    class Meta:
        model = Motherboard
        fields = ['id', 'component', 'socket', 'memory_type', 'memory_slots', 'supports_integrated_graphics']


class RAMSerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)

    class Meta:
        model = RAM
        fields = ['id', 'component', 'memory_type', 'capacity_gb', 'frequency_mhz']


class PowerSupplySerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)

    class Meta:
        model = PowerSupply
        fields = ['id', 'component', 'wattage', 'efficiency_cert']


class GPUSerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)

    class Meta:
        model = GPU
        fields = ['id', 'component', 'power_consumption', 'power_connectors']


class IncompatibilitySerializer(serializers.ModelSerializer):
    component_1 = ComponentSerializer(read_only=True)
    component_2 = ComponentSerializer(read_only=True)
    component_1_id = serializers.PrimaryKeyRelatedField(
        queryset=Component.objects.all(), source='component_1', write_only=True
    )
    component_2_id = serializers.PrimaryKeyRelatedField(
        queryset=Component.objects.all(), source='component_2', write_only=True
    )

    class Meta:
        model = Incompatibility
        fields = ['id', 'component_1', 'component_2', 'component_1_id', 'component_2_id', 'reason']

    def validate(self, data):
        c1 = data.get('component_1')
        c2 = data.get('component_2')
        if c1 and c2 and c1 == c2:
            raise serializers.ValidationError('Компонент не может быть несовместим сам с собой.')
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'role', 'created_at']
        read_only_fields = ['created_at']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['login', 'password']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class BuildSerializer(serializers.ModelSerializer):
    processor = ProcessorSerializer(read_only=True)
    motherboard = MotherboardSerializer(read_only=True)
    ram = RAMSerializer(read_only=True)
    psu = PowerSupplySerializer(read_only=True)
    gpu = GPUSerializer(read_only=True)
    price_category = PriceCategorySerializer(read_only=True)

    processor_id = serializers.PrimaryKeyRelatedField(
        queryset=Processor.objects.all(), source='processor', write_only=True
    )
    motherboard_id = serializers.PrimaryKeyRelatedField(
        queryset=Motherboard.objects.all(), source='motherboard', write_only=True
    )
    ram_id = serializers.PrimaryKeyRelatedField(
        queryset=RAM.objects.all(), source='ram', write_only=True
    )
    psu_id = serializers.PrimaryKeyRelatedField(
        queryset=PowerSupply.objects.all(), source='psu', write_only=True
    )
    gpu_id = serializers.PrimaryKeyRelatedField(
        queryset=GPU.objects.all(), source='gpu', write_only=True, required=False, allow_null=True
    )
    price_category_id = serializers.PrimaryKeyRelatedField(
        queryset=PriceCategory.objects.all(), source='price_category', write_only=True
    )

    class Meta:
        model = Build
        fields = [
            'id', 'processor', 'motherboard', 'ram', 'psu', 'gpu', 'price_category',
            'processor_id', 'motherboard_id', 'ram_id', 'psu_id', 'gpu_id', 'price_category_id',
            'is_compatible', 'created_at',
        ]
        read_only_fields = ['is_compatible', 'created_at']


class HistorySerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = History
        fields = ['id', 'component', 'old_value', 'new_value', 'updated_at', 'user']
