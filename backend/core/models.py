from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class PriceCategory(models.Model):
    category_name = models.CharField(max_length=50)
    min_price = models.IntegerField()
    max_price = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Ценовая категория'
        verbose_name_plural = 'Ценовые категории'
        ordering = ['min_price']

    def __str__(self):
        return self.category_name


COMPONENT_TYPE_CHOICES = [
    ('processor', 'Процессор'),
    ('motherboard', 'Материнская плата'),
    ('ram', 'Оперативная память'),
    ('psu', 'Блок питания'),
    ('gpu', 'Видеокарта'),
]

SOCKET_CHOICES = [
    ('LGA1700', 'LGA1700'),
    ('LGA1200', 'LGA1200'),
    ('AM5', 'AM5'),
    ('AM4', 'AM4'),
]

MEMORY_TYPE_CHOICES = [
    ('DDR4', 'DDR4'),
    ('DDR5', 'DDR5'),
]

EFFICIENCY_CERT_CHOICES = [
    ('', 'Без сертификата'),
    ('80Plus', '80 Plus'),
    ('Bronze', '80 Plus Bronze'),
    ('Silver', '80 Plus Silver'),
    ('Gold', '80 Plus Gold'),
    ('Platinum', '80 Plus Platinum'),
    ('Titanium', '80 Plus Titanium'),
]

CAPACITY_CHOICES = [
    (4, '4 ГБ'),
    (8, '8 ГБ'),
    (16, '16 ГБ'),
    (32, '32 ГБ'),
    (64, '64 ГБ'),
]


class Component(models.Model):
    component_name = models.CharField(max_length=200)
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPE_CHOICES)
    price_category = models.ForeignKey(
        PriceCategory, on_delete=models.PROTECT, related_name='components'
    )
    is_required = models.BooleanField(default=True)
    date_added = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Компонент'
        verbose_name_plural = 'Компоненты'
        ordering = ['component_type', 'component_name']

    def __str__(self):
        return self.component_name

    def get_type_prefix(self):
        prefixes = {
            'processor': 'PRO',
            'motherboard': 'MBO',
            'ram': 'RAM',
            'psu': 'PSU',
            'gpu': 'GPU',
        }
        return prefixes.get(self.component_type, 'CMP')

    def get_display_id(self):
        return f'#{self.get_type_prefix()}-{self.pk:05d}'

    def get_detail(self):
        type_to_attr = {
            'processor': 'processor',
            'motherboard': 'motherboard',
            'ram': 'ram',
            'psu': 'powersupply',
            'gpu': 'gpu',
        }
        attr = type_to_attr.get(self.component_type)
        return getattr(self, attr, None) if attr else None


class Processor(models.Model):
    component = models.OneToOneField(
        Component, on_delete=models.CASCADE, related_name='processor'
    )
    socket = models.CharField(max_length=20, choices=SOCKET_CHOICES)
    tdp = models.IntegerField()
    has_integrated_graphics = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Процессор'
        verbose_name_plural = 'Процессоры'

    def __str__(self):
        return self.component.component_name


class Motherboard(models.Model):
    component = models.OneToOneField(
        Component, on_delete=models.CASCADE, related_name='motherboard'
    )
    socket = models.CharField(max_length=20, choices=SOCKET_CHOICES)
    memory_type = models.CharField(max_length=10, choices=MEMORY_TYPE_CHOICES)
    memory_slots = models.IntegerField(default=2)
    supports_integrated_graphics = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Материнская плата'
        verbose_name_plural = 'Материнские платы'

    def __str__(self):
        return self.component.component_name


class RAM(models.Model):
    component = models.OneToOneField(
        Component, on_delete=models.CASCADE, related_name='ram'
    )
    memory_type = models.CharField(max_length=10, choices=MEMORY_TYPE_CHOICES)
    capacity_gb = models.IntegerField(choices=CAPACITY_CHOICES)
    frequency_mhz = models.IntegerField(null=True, blank=True)

    class Meta:
        verbose_name = 'Оперативная память'
        verbose_name_plural = 'Оперативная память'

    def __str__(self):
        return self.component.component_name


class PowerSupply(models.Model):
    component = models.OneToOneField(
        Component, on_delete=models.CASCADE, related_name='powersupply'
    )
    wattage = models.IntegerField()
    efficiency_cert = models.CharField(
        max_length=20, choices=EFFICIENCY_CERT_CHOICES, blank=True, default=''
    )

    class Meta:
        verbose_name = 'Блок питания'
        verbose_name_plural = 'Блоки питания'

    def __str__(self):
        return self.component.component_name


class GPU(models.Model):
    component = models.OneToOneField(
        Component, on_delete=models.CASCADE, related_name='gpu'
    )
    power_consumption = models.IntegerField()
    power_connectors = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'Видеокарта'
        verbose_name_plural = 'Видеокарты'

    def __str__(self):
        return self.component.component_name


class Incompatibility(models.Model):
    component_1 = models.ForeignKey(
        Component, on_delete=models.CASCADE, related_name='incompatibilities_as_1'
    )
    component_2 = models.ForeignKey(
        Component, on_delete=models.CASCADE, related_name='incompatibilities_as_2'
    )
    reason = models.TextField()

    class Meta:
        verbose_name = 'Несовместимость'
        verbose_name_plural = 'Несовместимости'
        unique_together = [['component_1', 'component_2']]

    def __str__(self):
        return f'{self.component_1} ↔ {self.component_2}'


class UserManager(BaseUserManager):
    def create_user(self, login, password=None, **extra_fields):
        if not login:
            raise ValueError('Login обязателен')
        user = self.model(login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(login, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    login = models.CharField(max_length=150, unique=True)
    role = models.CharField(
        max_length=10,
        choices=[('admin', 'Администратор'), ('user', 'Пользователь')],
        default='user',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.login


class Build(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='builds')
    processor = models.ForeignKey(Processor, on_delete=models.SET_NULL, null=True)
    motherboard = models.ForeignKey(Motherboard, on_delete=models.SET_NULL, null=True)
    ram = models.ForeignKey(RAM, on_delete=models.SET_NULL, null=True)
    psu = models.ForeignKey(PowerSupply, on_delete=models.SET_NULL, null=True)
    gpu = models.ForeignKey(GPU, on_delete=models.SET_NULL, null=True, blank=True)
    price_category = models.ForeignKey(
        PriceCategory, on_delete=models.SET_NULL, null=True
    )
    is_compatible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Сборка'
        verbose_name_plural = 'Сборки'
        ordering = ['-created_at']

    def __str__(self):
        return f'Сборка #{self.pk} ({self.user.login})'


class History(models.Model):
    component = models.ForeignKey(
        Component, on_delete=models.CASCADE, related_name='history'
    )
    old_value = models.JSONField()
    new_value = models.JSONField()
    updated_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'История изменений'
        verbose_name_plural = 'История изменений'
        ordering = ['-updated_at']

    def __str__(self):
        return f'История компонента #{self.component_id} ({self.updated_at:%Y-%m-%d})'
