from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/',    views.login,    name='login'),
    path('logout/',   views.logout,   name='logout'),
    path('me/',       views.me,       name='me'),

    path('products/',              views.product_list_create, name='product-list-create'),
    path('products/<int:product_id>/', views.product_detail, name='product-detail'),
    
    # ── Scenarios ─────────────────────────────────────────────────────
    path('products/<int:product_id>/scenarios/',  views.scenario_list_create, name='scenario-list-create'),
    path('scenarios/<int:scenario_id>/',          views.scenario_detail,      name='scenario-detail'),
    path('scenarios/<int:scenario_id>/save/',     views.scenario_save,        name='scenario-save'),

     # Materials
    path("materials/subtypes/",      views.material_subtypes,      name="material-subtypes"),
    path("materials/by-subtype/",    views.materials_by_subtype,   name="materials-by-subtype"),

    # Energy
    path("energy/subtypes/",         views.energy_subtypes,        name="energy-subtypes"),
    path("energy/by-subtype/",       views.energies_by_subtype,    name="energies-by-subtype"),

    # Transport
    path("transport/subtypes/",      views.transport_subtypes,     name="transport-subtypes"),
    path("transport/by-subtype/",    views.transports_by_subtype,  name="transports-by-subtype"),

    # Packaging
    path("packaging/subtypes/",      views.packaging_subtypes,     name="packaging-subtypes"),
    path("packaging/by-subtype/",    views.packaging_by_subtype,  name="packagings-by-subtype"),

    # Production
    path("production/subtypes/",     views.production_subtypes,    name="production-subtypes"),
    path("production/by-subtype/",   views.productions_by_subtype, name="productions-by-subtype"),

    # End of Life
    path("end-of-life/subtypes/",    views.end_of_life_subtypes,   name="end-of-life-subtypes"),
    path("end-of-life/by-subtype/",  views.end_of_life_by_subtype, name="end-of-life-by-subtype"),
]