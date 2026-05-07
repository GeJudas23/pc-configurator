from .models import Incompatibility


class ConfigurationError(Exception):
    def __init__(self, error_type, message, recommendation, step=None):
        super().__init__(message)
        self.error_type = error_type
        self.message = message
        self.recommendation = recommendation
        self.step = step  # wizard step name to redirect for fix


def validate_configuration(processor, motherboard, ram, psu, gpu=None):
    errors = []

    # 1. Socket compatibility: processor <-> motherboard
    if processor.socket != motherboard.socket:
        errors.append(ConfigurationError(
            error_type='SOCKET_MISMATCH',
            message=(
                f'Процессор {processor.component.component_name} использует сокет {processor.socket}, '
                f'но материнская плата {motherboard.component.component_name} поддерживает сокет {motherboard.socket}.'
            ),
            recommendation=f'Выберите материнскую плату с сокетом {processor.socket} или процессор под сокет {motherboard.socket}.',
            step='motherboard',
        ))

    # 2. Memory type: motherboard <-> RAM
    if motherboard.memory_type != ram.memory_type:
        errors.append(ConfigurationError(
            error_type='MEMORY_TYPE_MISMATCH',
            message=(
                f'Материнская плата {motherboard.component.component_name} поддерживает {motherboard.memory_type}, '
                f'но выбрана память {ram.component.component_name} типа {ram.memory_type}.'
            ),
            recommendation=f'Выберите оперативную память типа {motherboard.memory_type}.',
            step='ram',
        ))

    # 3. PSU wattage: must cover CPU TDP + GPU power + 100W reserve
    gpu_power = gpu.power_consumption if gpu else 0
    required_power = processor.tdp + gpu_power + 100
    if psu.wattage < required_power:
        errors.append(ConfigurationError(
            error_type='INSUFFICIENT_POWER',
            message=(
                f'Блок питания {psu.component.component_name} ({psu.wattage}W) недостаточен. '
                f'Требуется минимум {required_power}W '
                f'(CPU {processor.tdp}W + GPU {gpu_power}W + резерв 100W).'
            ),
            recommendation=f'Выберите блок питания мощностью не менее {required_power}W.',
            step='psu',
        ))

    # 4. GPU skipped but processor lacks integrated graphics
    if gpu is None and not processor.has_integrated_graphics:
        errors.append(ConfigurationError(
            error_type='NO_DISPLAY_OUTPUT',
            message=(
                f'Процессор {processor.component.component_name} не имеет встроенной графики. '
                f'Без видеокарты система не сможет выводить изображение.'
            ),
            recommendation='Добавьте видеокарту или выберите процессор со встроенной графикой.',
            step='gpu',
        ))

    # 5. Explicit incompatibility table
    all_components = [
        processor.component, motherboard.component,
        ram.component, psu.component,
    ]
    if gpu:
        all_components.append(gpu.component)

    component_ids = [c.pk for c in all_components]
    incompatibilities = Incompatibility.objects.filter(
        component_1_id__in=component_ids,
        component_2_id__in=component_ids,
    ).select_related('component_1', 'component_2')

    for inc in incompatibilities:
        errors.append(ConfigurationError(
            error_type='EXPLICIT_INCOMPATIBILITY',
            message=f'{inc.component_1.component_name} несовместим с {inc.component_2.component_name}: {inc.reason}',
            recommendation='Замените один из несовместимых компонентов.',
            step=None,
        ))

    return errors
