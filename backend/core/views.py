from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction

from .models import (
    PriceCategory, Component, Processor, Motherboard, RAM,
    PowerSupply, GPU, Incompatibility, Build, History, User,
)
from .serializers import (
    PriceCategorySerializer, ComponentSerializer,
    ProcessorSerializer, MotherboardSerializer, RAMSerializer,
    PowerSupplySerializer, GPUSerializer, IncompatibilitySerializer,
    UserSerializer, UserRegisterSerializer, BuildSerializer, HistorySerializer,
)
from .permissions import IsAdmin, IsAdminOrReadOnly, IsOwner
from .solver import validate_configuration


# ---------- Auth ----------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    login_val = request.data.get('login')
    password = request.data.get('password')
    try:
        user = User.objects.get(login=login_val)
    except User.DoesNotExist:
        return Response({'detail': 'Неверный логин или пароль.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(password):
        return Response({'detail': 'Неверный логин или пароль.'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['GET'])
def current_user(request):
    return Response(UserSerializer(request.user).data)


# ---------- PriceCategory ----------

class PriceCategoryListView(generics.ListAPIView):
    queryset = PriceCategory.objects.all()
    serializer_class = PriceCategorySerializer


# ---------- Component ----------

class ComponentListCreateView(generics.ListCreateAPIView):
    serializer_class = ComponentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Component.objects.select_related('price_category').order_by('component_type', 'component_name')
        ctype = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        if ctype:
            qs = qs.filter(component_type=ctype)
        if category:
            qs = qs.filter(price_category_id=category)
        return qs


class ComponentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Component.objects.select_related('price_category')
    serializer_class = ComponentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = ComponentSerializer(old_instance).data
        instance = serializer.save()
        new_data = ComponentSerializer(instance).data
        History.objects.create(
            component=instance,
            old_value=old_data,
            new_value=new_data,
            user=self.request.user,
        )


# ---------- Typed component lists (for wizard selectors) ----------

class ProcessorListView(generics.ListAPIView):
    serializer_class = ProcessorSerializer

    def get_queryset(self):
        qs = Processor.objects.select_related('component', 'component__price_category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(component__price_category_id=category)
        return qs


class MotherboardListView(generics.ListAPIView):
    serializer_class = MotherboardSerializer

    def get_queryset(self):
        qs = Motherboard.objects.select_related('component', 'component__price_category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(component__price_category_id=category)
        return qs


class RAMListView(generics.ListAPIView):
    serializer_class = RAMSerializer

    def get_queryset(self):
        qs = RAM.objects.select_related('component', 'component__price_category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(component__price_category_id=category)
        return qs


class PowerSupplyListView(generics.ListAPIView):
    serializer_class = PowerSupplySerializer

    def get_queryset(self):
        qs = PowerSupply.objects.select_related('component', 'component__price_category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(component__price_category_id=category)
        return qs


class GPUListView(generics.ListAPIView):
    serializer_class = GPUSerializer

    def get_queryset(self):
        qs = GPU.objects.select_related('component', 'component__price_category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(component__price_category_id=category)
        return qs


# ---------- Incompatibility ----------

class IncompatibilityListCreateView(generics.ListCreateAPIView):
    queryset = Incompatibility.objects.select_related('component_1', 'component_2')
    serializer_class = IncompatibilitySerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        c1 = serializer.validated_data['component_1']
        c2 = serializer.validated_data['component_2']
        if c1.pk > c2.pk:
            c1, c2 = c2, c1
        Incompatibility.objects.get_or_create(
            component_1=c1, component_2=c2,
            defaults={'reason': serializer.validated_data['reason']},
        )


class IncompatibilityDeleteView(generics.DestroyAPIView):
    queryset = Incompatibility.objects.all()
    serializer_class = IncompatibilitySerializer
    permission_classes = [IsAdmin]


# ---------- Compatibility check ----------

@api_view(['POST'])
def check_compatibility(request):
    data = request.data
    try:
        processor = Processor.objects.select_related('component').get(pk=data['processor_id'])
        motherboard = Motherboard.objects.select_related('component').get(pk=data['motherboard_id'])
        ram = RAM.objects.select_related('component').get(pk=data['ram_id'])
        psu = PowerSupply.objects.select_related('component').get(pk=data['psu_id'])
        gpu = None
        if data.get('gpu_id'):
            gpu = GPU.objects.select_related('component').get(pk=data['gpu_id'])
    except (KeyError, Processor.DoesNotExist, Motherboard.DoesNotExist,
            RAM.DoesNotExist, PowerSupply.DoesNotExist, GPU.DoesNotExist) as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    errors = validate_configuration(processor, motherboard, ram, psu, gpu)
    return Response({
        'is_compatible': len(errors) == 0,
        'errors': [
            {
                'error_type': e.error_type,
                'message': e.message,
                'recommendation': e.recommendation,
                'step': e.step,
            }
            for e in errors
        ],
    })


# ---------- Builds ----------

class BuildListCreateView(generics.ListCreateAPIView):
    serializer_class = BuildSerializer

    def get_queryset(self):
        return Build.objects.filter(user=self.request.user).select_related(
            'processor__component', 'motherboard__component',
            'ram__component', 'psu__component', 'gpu__component', 'price_category',
        )

    def perform_create(self, serializer):
        data = self.request.data
        processor = Processor.objects.get(pk=data['processor_id'])
        motherboard = Motherboard.objects.get(pk=data['motherboard_id'])
        ram = RAM.objects.get(pk=data['ram_id'])
        psu = PowerSupply.objects.get(pk=data['psu_id'])
        gpu = GPU.objects.get(pk=data['gpu_id']) if data.get('gpu_id') else None

        errors = validate_configuration(processor, motherboard, ram, psu, gpu)
        serializer.save(user=self.request.user, is_compatible=(len(errors) == 0))


class BuildDetailView(generics.RetrieveAPIView):
    serializer_class = BuildSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Build.objects.filter(user=self.request.user)


# ---------- History ----------

class HistoryListView(generics.ListAPIView):
    serializer_class = HistorySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = History.objects.select_related('component', 'user')
        component_id = self.request.query_params.get('component')
        if component_id:
            qs = qs.filter(component_id=component_id)
        return qs
