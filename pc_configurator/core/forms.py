from django import forms
from .models import (
    Component, PriceCategory,
    Processor, Motherboard, RAM, PowerSupply, GPU, Incompatibility,
    SOCKET_CHOICES, MEMORY_TYPE_CHOICES, EFFICIENCY_CERT_CHOICES, CAPACITY_CHOICES,
    COMPONENT_TYPE_CHOICES,
)


class ComponentBaseForm(forms.ModelForm):
    class Meta:
        model = Component
        fields = ['component_name', 'price_category', 'is_required']
        widgets = {
            'component_name': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Введите название'}),
            'price_category': forms.Select(attrs={'class': 'form-select'}),
            'is_required': forms.CheckboxInput(attrs={'class': 'checkbox'}),
        }
        labels = {
            'component_name': 'Название',
            'price_category': 'Мин. ценовая категория',
            'is_required': 'Обязательный компонент',
        }


class ProcessorForm(forms.ModelForm):
    class Meta:
        model = Processor
        fields = ['socket', 'tdp', 'has_integrated_graphics']
        widgets = {
            'socket': forms.Select(attrs={'class': 'form-select'}),
            'tdp': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Например: 65', 'min': '1'}),
            'has_integrated_graphics': forms.CheckboxInput(attrs={'class': 'checkbox'}),
        }
        labels = {
            'socket': 'Сокет',
            'tdp': 'TDP (Ватт)',
            'has_integrated_graphics': 'Встроенная графика',
        }


class MotherboardForm(forms.ModelForm):
    memory_type = forms.ChoiceField(
        choices=MEMORY_TYPE_CHOICES,
        widget=forms.RadioSelect(attrs={'class': 'radio-input'}),
        label='Тип памяти',
    )

    class Meta:
        model = Motherboard
        fields = ['socket', 'memory_type', 'memory_slots', 'supports_integrated_graphics']
        widgets = {
            'socket': forms.Select(attrs={'class': 'form-select'}),
            'memory_slots': forms.NumberInput(attrs={'class': 'form-input', 'min': '1', 'max': '8'}),
            'supports_integrated_graphics': forms.CheckboxInput(attrs={'class': 'checkbox'}),
        }
        labels = {
            'socket': 'Сокет',
            'memory_slots': 'Количество слотов памяти',
            'supports_integrated_graphics': 'Поддержка встроенной графики',
        }


class RAMForm(forms.ModelForm):
    memory_type = forms.ChoiceField(
        choices=MEMORY_TYPE_CHOICES,
        widget=forms.RadioSelect(attrs={'class': 'radio-input'}),
        label='Тип памяти',
    )
    capacity_gb = forms.ChoiceField(
        choices=CAPACITY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Объём',
    )

    class Meta:
        model = RAM
        fields = ['memory_type', 'capacity_gb', 'frequency_mhz']
        widgets = {
            'frequency_mhz': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Например: 3200', 'min': '1600'}),
        }
        labels = {
            'frequency_mhz': 'Частота (МГц)',
        }

    def clean_capacity_gb(self):
        return int(self.cleaned_data['capacity_gb'])


class PSUForm(forms.ModelForm):
    class Meta:
        model = PowerSupply
        fields = ['wattage', 'efficiency_cert']
        widgets = {
            'wattage': forms.NumberInput(attrs={'class': 'form-input', 'min': '200', 'step': '50', 'placeholder': 'Например: 650'}),
            'efficiency_cert': forms.Select(attrs={'class': 'form-select'}),
        }
        labels = {
            'wattage': 'Мощность (Ватт)',
            'efficiency_cert': 'Сертификат эффективности',
        }


class GPUForm(forms.ModelForm):
    class Meta:
        model = GPU
        fields = ['power_consumption', 'power_connectors']
        widgets = {
            'power_consumption': forms.NumberInput(attrs={'class': 'form-input', 'min': '50', 'placeholder': 'Например: 170'}),
            'power_connectors': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Например: 1x 16-pin (опционально)'}),
        }
        labels = {
            'power_consumption': 'Потребляемая мощность (Ватт)',
            'power_connectors': 'Разъёмы питания',
        }


class IncompatibilityForm(forms.Form):
    component_1 = forms.ModelChoiceField(
        queryset=Component.objects.select_related('price_category').order_by('component_type', 'component_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Компонент 1',
        empty_label='— Выберите компонент —',
    )
    component_2 = forms.ModelChoiceField(
        queryset=Component.objects.select_related('price_category').order_by('component_type', 'component_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Компонент 2',
        empty_label='— Выберите компонент —',
    )
    reason = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-input', 'rows': '3', 'placeholder': 'Причина несовместимости...'}),
        label='Причина несовместимости',
    )

    def clean(self):
        cleaned_data = super().clean()
        c1 = cleaned_data.get('component_1')
        c2 = cleaned_data.get('component_2')
        if c1 and c2 and c1 == c2:
            raise forms.ValidationError('Компонент не может быть несовместим сам с собой.')
        return cleaned_data


class CustomBuildForm(forms.Form):
    processor = forms.ModelChoiceField(
        queryset=Processor.objects.select_related('component', 'component__price_category').order_by('component__component_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Процессор',
        empty_label='— Выберите процессор —',
    )
    motherboard = forms.ModelChoiceField(
        queryset=Motherboard.objects.select_related('component', 'component__price_category').order_by('component__component_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Материнская плата',
        empty_label='— Выберите материнскую плату —',
    )
    ram = forms.ModelChoiceField(
        queryset=RAM.objects.select_related('component', 'component__price_category').order_by('component__component_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Оперативная память',
        empty_label='— Выберите ОЗУ —',
    )
    psu = forms.ModelChoiceField(
        queryset=PowerSupply.objects.select_related('component', 'component__price_category').order_by('wattage'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Блок питания',
        empty_label='— Выберите БП —',
    )
    gpu = forms.ModelChoiceField(
        queryset=GPU.objects.select_related('component', 'component__price_category').order_by('component__component_name'),
        widget=forms.Select(attrs={'class': 'form-select'}),
        label='Видеокарта',
        required=False,
        empty_label='— Без видеокарты (iGPU) —',
    )
