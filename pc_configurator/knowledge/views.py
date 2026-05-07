from django.shortcuts import render, redirect, get_object_or_404
from django.db import transaction
from django.urls import reverse

from core.models import Component, Processor, Motherboard, RAM, PowerSupply, GPU, Incompatibility
from core.forms import (
    ComponentBaseForm, ProcessorForm, MotherboardForm,
    RAMForm, PSUForm, GPUForm, IncompatibilityForm,
)

COMPONENT_TYPE_NAMES = {
    'processor': 'Процессоры',
    'motherboard': 'Материнские платы',
    'ram': 'Оперативная память',
    'psu': 'Блоки питания',
    'gpu': 'Видеокарты',
}

EDIT_URL_NAMES = {
    'processor': 'knowledge:processor_edit',
    'motherboard': 'knowledge:motherboard_edit',
    'ram': 'knowledge:ram_edit',
    'psu': 'knowledge:psu_edit',
    'gpu': 'knowledge:gpu_edit',
}


def component_list(request):
    components = (
        Component.objects.select_related('price_category')
        .order_by('component_type', 'component_name')
    )
    by_type = {}
    for c in components:
        c.edit_url = reverse(EDIT_URL_NAMES[c.component_type], args=[c.pk])
        by_type.setdefault(c.component_type, []).append(c)

    sections = [
        {'label': label, 'items': by_type.get(ctype, [])}
        for ctype, label in COMPONENT_TYPE_NAMES.items()
    ]
    return render(request, 'knowledge/component_list.html', {'sections': sections})


def _add_component(request, component_type, DetailForm, template):
    base_form = ComponentBaseForm(request.POST or None)
    detail_form = DetailForm(request.POST or None)
    if request.method == 'POST' and base_form.is_valid() and detail_form.is_valid():
        with transaction.atomic():
            component = base_form.save(commit=False)
            component.component_type = component_type
            component.save()
            detail = detail_form.save(commit=False)
            detail.component = component
            detail.save()
        return redirect('knowledge:component_list')
    return render(request, template, {
        'base_form': base_form,
        'detail_form': detail_form,
        'action': 'add',
    })


def _edit_component(request, pk, DetailModel, DetailForm, template):
    component = get_object_or_404(Component, pk=pk)
    detail = get_object_or_404(DetailModel, component=component)
    base_form = ComponentBaseForm(request.POST or None, instance=component)
    detail_form = DetailForm(request.POST or None, instance=detail)
    if request.method == 'POST' and base_form.is_valid() and detail_form.is_valid():
        with transaction.atomic():
            base_form.save()
            detail_form.save()
        return redirect('knowledge:component_list')
    return render(request, template, {
        'base_form': base_form,
        'detail_form': detail_form,
        'component': component,
        'detail': detail,
        'action': 'edit',
    })


def processor_add(request):
    return _add_component(request, 'processor', ProcessorForm, 'knowledge/processor_form.html')


def motherboard_add(request):
    return _add_component(request, 'motherboard', MotherboardForm, 'knowledge/motherboard_form.html')


def ram_add(request):
    return _add_component(request, 'ram', RAMForm, 'knowledge/ram_form.html')


def psu_add(request):
    return _add_component(request, 'psu', PSUForm, 'knowledge/psu_form.html')


def gpu_add(request):
    return _add_component(request, 'gpu', GPUForm, 'knowledge/gpu_form.html')


def processor_edit(request, pk):
    return _edit_component(request, pk, Processor, ProcessorForm, 'knowledge/processor_form.html')


def motherboard_edit(request, pk):
    return _edit_component(request, pk, Motherboard, MotherboardForm, 'knowledge/motherboard_form.html')


def ram_edit(request, pk):
    return _edit_component(request, pk, RAM, RAMForm, 'knowledge/ram_form.html')


def psu_edit(request, pk):
    return _edit_component(request, pk, PowerSupply, PSUForm, 'knowledge/psu_form.html')


def gpu_edit(request, pk):
    return _edit_component(request, pk, GPU, GPUForm, 'knowledge/gpu_form.html')


def component_delete(request, component_type, pk):
    component = get_object_or_404(Component, pk=pk, component_type=component_type)
    detail = component.get_detail()
    if request.method == 'POST':
        component.delete()
        return redirect('knowledge:component_list')
    return render(request, 'knowledge/component_delete.html', {
        'component': component,
        'detail': detail,
        'type_name': COMPONENT_TYPE_NAMES.get(component_type, component_type),
    })


def incompatibility_list(request):
    incompatibilities = (
        Incompatibility.objects.select_related(
            'component_1__price_category',
            'component_2__price_category',
        ).order_by('component_1__component_type', 'component_1__component_name')
    )
    return render(request, 'knowledge/incompatibility_list.html', {
        'incompatibilities': incompatibilities,
    })


def incompatibility_add(request):
    form = IncompatibilityForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        c1 = form.cleaned_data['component_1']
        c2 = form.cleaned_data['component_2']
        # Store canonical order (smaller pk first) to avoid duplicates
        if c1.pk > c2.pk:
            c1, c2 = c2, c1
        Incompatibility.objects.get_or_create(
            component_1=c1,
            component_2=c2,
            defaults={'reason': form.cleaned_data['reason']},
        )
        return redirect('knowledge:incompatibility_list')
    return render(request, 'knowledge/incompatibility_form.html', {'form': form})


def incompatibility_delete(request, pk):
    inc = get_object_or_404(Incompatibility, pk=pk)
    if request.method == 'POST':
        inc.delete()
        return redirect('knowledge:incompatibility_list')
    return render(request, 'knowledge/incompatibility_confirm_delete.html', {'inc': inc})
