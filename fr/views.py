from rest_framework import viewsets
from fr.models import Fry, FrySerializer


class FryViewSet(viewsets.ModelViewSet):
    queryset = Fry.objects.all()
    serializer_class = FrySerializer
