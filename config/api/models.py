from django.db import models
from django.contrib.auth.hashers import make_password, check_password
# =========================
# USER
# =========================
class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    class Meta:
        db_table = 'user'

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.name
# =========================
# PRODUCT
# =========================
class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    default_scenario = models.ForeignKey("Scenario", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'product'

    def __str__(self):
        return self.name




# =========================
# SCENARIO
# =========================
class Scenario(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'scenario'

    def __str__(self):
        return self.name


# =========================
# MATERIAL
# =========================
class Material(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    subtype = models.CharField(max_length=100, blank=True)
    eco_cost = models.FloatField()
    carbon_kg = models.FloatField()
    unit = models.CharField(max_length=50, default="kg")


    class Meta:
        db_table = 'material'

    def __str__(self):
        return self.name


class ScenarioMaterial(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.FloatField(default=1)
    is_packaging = models.BooleanField(default=False) 
    class Meta:
        db_table = 'scenario_material'
        unique_together = ['scenario', 'material']




# =========================
# ENERGY
# =========================
class Energy(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    subtype = models.CharField(max_length=100, blank=True)
    eco_cost = models.FloatField()
    carbon_kg = models.FloatField()
    unit = models.CharField(max_length=50, default="kWh")


    class Meta:
        db_table = 'energy'

    def __str__(self):
        return self.name


class ScenarioEnergy(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    energy = models.ForeignKey(Energy, on_delete=models.CASCADE)
    quantity = models.FloatField(default=1)

    class Meta:
        db_table = 'scenario_energy'


# =========================
# TRANSPORT
# =========================
class Transport(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    subtype = models.CharField(max_length=100, blank=True)
    eco_cost = models.FloatField()
    carbon_kg = models.FloatField()
    unit = models.CharField(max_length=50, default="km")


    class Meta:
        db_table = 'transport'

    def __str__(self):
        return self.name


class ScenarioTransport(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    transport = models.ForeignKey(Transport, on_delete=models.CASCADE)
    distance = models.FloatField(default=0)

    class Meta:
        db_table = 'scenario_transport'


# =========================
# PRODUCTION (PROCESS)
# =========================
class Production(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    subtype = models.CharField(max_length=100, blank=True)
    eco_cost = models.FloatField()
    carbon_kg = models.FloatField()
    unit = models.CharField(max_length=50, default="unit")


    class Meta:
        db_table = 'production'

    def __str__(self):
        return self.name


class ScenarioProduction(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    production = models.ForeignKey(Production, on_delete=models.CASCADE)
    quantity = models.FloatField(default=1)

    class Meta:
        db_table = 'scenario_production'


# =========================
# END OF LIFE (WASTE)
# =========================
class EndOfLife(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    subtype = models.CharField(max_length=100, blank=True)
    eco_cost = models.FloatField()
    carbon_kg = models.FloatField()
    unit = models.CharField(max_length=50, default="kg")


    class Meta:
        db_table = 'end_of_life'

    def __str__(self):
        return self.name


class EndOfLifeProduct(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    end_of_life = models.ForeignKey(EndOfLife, on_delete=models.CASCADE)
    quantity = models.FloatField(default=1)

    class Meta:
        db_table = 'end_of_life_product'


class ScenarioEndOfLife(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    end_of_life = models.ForeignKey(EndOfLife, on_delete=models.CASCADE)
    quantity = models.FloatField(default=1)

    class Meta:
        db_table = 'scenario_end_of_life'



# =========================
# USAGE
# =========================
class Usage(models.Model):
    name = models.CharField(max_length=255)
    eco_cost = models.FloatField()
    carbon_kg = models.FloatField()

    class Meta:
        db_table = 'usage'


# =========================
# IMPACT RESULT
# =========================
class ImpactResult(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    total_eco_cost = models.FloatField(default=0)
    total_carbon_kg = models.FloatField(default=0)

    class Meta:
        db_table = 'impact_result'


# =========================
# RECOMMENDATION
# =========================
class Recommendation(models.Model):
    impact = models.ForeignKey(ImpactResult, on_delete=models.CASCADE)
    description = models.TextField()

    class Meta:
        db_table = 'recommendation'