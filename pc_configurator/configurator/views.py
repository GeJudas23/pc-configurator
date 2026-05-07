from django.shortcuts import render, redirect, get_object_or_404

from core.models import Component, PriceCategory, Processor, Motherboard, RAM, PowerSupply, GPU
from core.solver import validate_configuration
from core.forms import CustomBuildForm


def category_select(request):
    if request.method == 'POST':
        category_id = request.POST.get('category_id')
        if category_id:
            request.session.flush()
            request.session['category_id'] = int(category_id)
            return redirect('configurator:step_processor')
    categories = PriceCategory.objects.order_by('min_price')
    return render(request, 'configurator/category_select.html', {'categories': categories})


def _require_session(request, *keys):
    for key in keys:
        if key not in request.session:
            return False
    return True


def step_processor(request):
    if not _require_session(request, 'category_id'):
        return redirect('configurator:category_select')
    category_id = request.session['category_id']

    if request.method == 'POST':
        processor_id = request.POST.get('processor_id')
        if processor_id:
            request.session['processor_id'] = int(processor_id)
            return redirect('configurator:step_motherboard')

    processors = (
        Processor.objects.filter(component__price_category_id=category_id)
        .select_related('component', 'component__price_category')
        .order_by('component__component_name')
    )
    selected_id = request.session.get('processor_id')
    return render(request, 'configurator/step_processor.html', {
        'processors': processors,
        'selected_id': selected_id,
        'step': 1,
    })


def step_motherboard(request):
    if not _require_session(request, 'category_id', 'processor_id'):
        return redirect('configurator:step_processor')
    category_id = request.session['category_id']
    processor = get_object_or_404(
        Processor.objects.select_related('component'),
        component__price_category_id=category_id,
        pk=request.session['processor_id'],
    )

    if request.method == 'POST':
        motherboard_id = request.POST.get('motherboard_id')
        if motherboard_id:
            request.session['motherboard_id'] = int(motherboard_id)
            return redirect('configurator:step_ram')

    motherboards = (
        Motherboard.objects.filter(
            component__price_category_id=category_id,
            socket=processor.socket,
        )
        .select_related('component', 'component__price_category')
        .order_by('component__component_name')
    )
    selected_id = request.session.get('motherboard_id')
    return render(request, 'configurator/step_motherboard.html', {
        'motherboards': motherboards,
        'processor': processor,
        'selected_id': selected_id,
        'step': 2,
    })


def step_ram(request):
    if not _require_session(request, 'category_id', 'processor_id', 'motherboard_id'):
        return redirect('configurator:step_motherboard')
    category_id = request.session['category_id']
    motherboard = get_object_or_404(
        Motherboard.objects.select_related('component'),
        component__price_category_id=category_id,
        pk=request.session['motherboard_id'],
    )

    if request.method == 'POST':
        ram_id = request.POST.get('ram_id')
        if ram_id:
            request.session['ram_id'] = int(ram_id)
            return redirect('configurator:step_psu')

    rams = (
        RAM.objects.filter(
            component__price_category_id=category_id,
            memory_type=motherboard.memory_type,
        )
        .select_related('component', 'component__price_category')
        .order_by('component__component_name')
    )
    selected_id = request.session.get('ram_id')
    return render(request, 'configurator/step_ram.html', {
        'rams': rams,
        'motherboard': motherboard,
        'selected_id': selected_id,
        'step': 3,
    })


def step_psu(request):
    if not _require_session(request, 'category_id', 'processor_id', 'motherboard_id', 'ram_id'):
        return redirect('configurator:step_ram')
    category_id = request.session['category_id']
    processor = get_object_or_404(
        Processor.objects.select_related('component'),
        component__price_category_id=category_id,
        pk=request.session['processor_id'],
    )

    if request.method == 'POST':
        psu_id = request.POST.get('psu_id')
        if psu_id:
            request.session['psu_id'] = int(psu_id)
            return redirect('configurator:step_gpu')

    psus = (
        PowerSupply.objects.filter(component__price_category_id=category_id)
        .select_related('component', 'component__price_category')
        .order_by('wattage')
    )
    recommended_wattage = processor.tdp + 100
    selected_id = request.session.get('psu_id')
    return render(request, 'configurator/step_psu.html', {
        'psus': psus,
        'processor': processor,
        'recommended_wattage': recommended_wattage,
        'selected_id': selected_id,
        'step': 4,
    })


def step_gpu(request):
    if not _require_session(request, 'category_id', 'processor_id', 'psu_id'):
        return redirect('configurator:step_psu')
    category_id = request.session['category_id']
    processor = get_object_or_404(
        Processor.objects.select_related('component'),
        component__price_category_id=category_id,
        pk=request.session['processor_id'],
    )
    psu = get_object_or_404(
        PowerSupply.objects.select_related('component'),
        component__price_category_id=category_id,
        pk=request.session['psu_id'],
    )

    if request.method == 'POST':
        gpu_id = request.POST.get('gpu_id')
        request.session['gpu_id'] = int(gpu_id) if gpu_id and gpu_id != 'skip' else None
        return redirect('configurator:result')

    gpus = (
        GPU.objects.filter(component__price_category_id=category_id)
        .select_related('component', 'component__price_category')
        .order_by('component__component_name')
    )
    selected_id = request.session.get('gpu_id')
    gpu_skipped = 'gpu_id' in request.session and selected_id is None
    return render(request, 'configurator/step_gpu.html', {
        'gpus': gpus,
        'processor': processor,
        'psu': psu,
        'selected_id': selected_id,
        'gpu_skipped': gpu_skipped,
        'step': 5,
    })


def result(request):
    if not _require_session(request, 'category_id', 'processor_id', 'motherboard_id', 'ram_id', 'psu_id'):
        return redirect('configurator:category_select')

    category_id = request.session['category_id']
    try:
        processor = Processor.objects.select_related('component', 'component__price_category').get(
            pk=request.session['processor_id']
        )
        motherboard = Motherboard.objects.select_related('component', 'component__price_category').get(
            pk=request.session['motherboard_id']
        )
        ram = RAM.objects.select_related('component', 'component__price_category').get(
            pk=request.session['ram_id']
        )
        psu = PowerSupply.objects.select_related('component', 'component__price_category').get(
            pk=request.session['psu_id']
        )
        gpu_id = request.session.get('gpu_id')
        gpu = GPU.objects.select_related('component', 'component__price_category').get(pk=gpu_id) if gpu_id else None
    except Exception:
        return redirect('configurator:category_select')

    errors = validate_configuration(processor, motherboard, ram, psu, gpu)

    gpu_power = gpu.power_consumption if gpu else 0
    total_power = processor.tdp + gpu_power
    power_margin = psu.wattage - total_power

    category = PriceCategory.objects.get(pk=category_id)

    if errors:
        return render(request, 'configurator/result_error.html', {
            'errors': errors,
            'processor': processor,
            'motherboard': motherboard,
            'ram': ram,
            'psu': psu,
            'gpu': gpu,
            'category': category,
        })

    return render(request, 'configurator/result_success.html', {
        'processor': processor,
        'motherboard': motherboard,
        'ram': ram,
        'psu': psu,
        'gpu': gpu,
        'category': category,
        'total_power': total_power,
        'power_margin': power_margin,
    })


def reset(request):
    request.session.flush()
    return redirect('configurator:category_select')


def custom_build(request):
    form = CustomBuildForm(request.POST or None)
    result_ctx = None

    if request.method == 'POST' and form.is_valid():
        processor = form.cleaned_data['processor']
        motherboard = form.cleaned_data['motherboard']
        ram = form.cleaned_data['ram']
        psu = form.cleaned_data['psu']
        gpu = form.cleaned_data['gpu']

        errors = validate_configuration(processor, motherboard, ram, psu, gpu)

        gpu_power = gpu.power_consumption if gpu else 0
        total_power = processor.tdp + gpu_power
        power_margin = psu.wattage - total_power

        result_ctx = {
            'errors': errors,
            'processor': processor,
            'motherboard': motherboard,
            'ram': ram,
            'psu': psu,
            'gpu': gpu,
            'total_power': total_power,
            'power_margin': power_margin,
            'ok': len(errors) == 0,
        }

    return render(request, 'configurator/custom_build.html', {
        'form': form,
        'result': result_ctx,
    })
