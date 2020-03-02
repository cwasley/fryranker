from django.db import models
from rest_framework import serializers


class Fry(models.Model):
    name = models.CharField(max_length=255)
    num_votes = models.IntegerField(default=0)
    created_on = models.DateTimeField(auto_now_add=True)

    def increase(self):
        self.num_votes += 1
        self.save()

    def decrease(self):
        self.num_votes -= 1
        self.save()

    def __str__(self):
        return self.name


class FrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Fry
        fields = '__all__'
