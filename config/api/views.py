import json
import logging
from urllib import response
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import ( Product, Scenario,
    ScenarioMaterial, ScenarioEnergy, ScenarioTransport,
    ScenarioProduction, ScenarioEndOfLife,
    Material, Energy, Transport, Production, EndOfLife,
    ImpactResult,)

logger = logging.getLogger(__name__)


@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            name = data.get('name')
            email = data.get('email')
            password = data.get('password')

            # Validation
            if not name or not email or not password:
                return JsonResponse({'error': 'All fields are required'}, status=400)

            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already exists'}, status=400)

            # Create user
            user = User(name=name, email=email)
            user.set_password(password)  # 🔐 HASH PASSWORD
            user.save()

            return JsonResponse({'message': 'User created successfully'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            email    = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'error': 'Email and password are required'}, status=400)

            # Find user by email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid email or password'}, status=401)

            # Check password
            if not user.check_password(password):
                return JsonResponse({'error': 'Invalid email or password'}, status=401)

            # Store user in session
            request.session['user_id']   = user.id
            request.session['user_name'] = user.name
            request.session['user_email'] = user.email

            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'id':    user.id,
                    'name':  user.name,
                    'email': user.email,
                }
            }, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def logout(request):
    if request.method == 'POST':
        request.session.flush()
        return JsonResponse({'message': 'Logged out successfully'}, status=200)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def me(request):
    """Return the currently logged-in user from session."""
    user_id = request.session.get('user_id')
    if not user_id:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return JsonResponse({
        'id':    request.session.get('user_id'),
        'name':  request.session.get('user_name'),
        'email': request.session.get('user_email'),
    })

def material_subtypes(request):
    subtypes = (
        Material.objects
        .exclude(subtype="")
        .values_list("subtype", flat=True)
        .distinct()
        .order_by("subtype")
    )
    result = list(subtypes)
    logger.debug("[material_subtypes] returning %d subtypes: %s", len(result), result)
    return JsonResponse(result, safe=False)

def materials_by_subtype(request):
    subtype = request.GET.get("subtype", "")
    logger.debug("[materials_by_subtype] subtype param: '%s'", subtype)
    materials = (
        Material.objects
        .filter(subtype=subtype)
        .values("id", "name", "short_name", "unit", "eco_cost", "carbon_kg")
        .order_by("name")
    )
    result = list(materials)
    logger.debug("[materials_by_subtype] returning %d items", len(result))
    return JsonResponse(result, safe=False)

def packaging_subtypes(request):
    subtypes = (
        Material.objects
        .filter(subtype="paper & packaging")
        .values_list("subtype", flat=True)
        .distinct()
        .order_by("subtype")
    )
    result = list(subtypes)
    logger.debug("[packaging_subtypes] returning %d subtypes: %s", len(result), result)
    return JsonResponse(result, safe=False)


def packaging_by_subtype(request):
    subtype = request.GET.get("subtype", "paper & packaging")
    logger.debug("[packaging_by_subtype] subtype param: '%s'", subtype)
    packaging = (
        Material.objects
        .filter(subtype=subtype)
        .values("id", "name", "short_name", "unit", "eco_cost", "carbon_kg")
        .order_by("name")
    )
    result = list(packaging)
    logger.debug("[packaging_by_subtype] returning %d items", len(result))
    return JsonResponse(result, safe=False)

def energy_subtypes(request):
    subtypes = (
        Energy.objects
        .exclude(subtype="")
        .values_list("subtype", flat=True)
        .distinct()
        .order_by("subtype")
    )
    result = list(subtypes)
    logger.debug("[energy_subtypes] returning %d subtypes: %s", len(result), result)
    return JsonResponse(result, safe=False)

def energies_by_subtype(request):
    subtype = request.GET.get("subtype", "")
    logger.debug("[energies_by_subtype] subtype param: '%s'", subtype)
    energies = (
        Energy.objects
        .filter(subtype=subtype)
        .values("id", "name", "short_name", "unit", "eco_cost", "carbon_kg")
        .order_by("name")
    )
    result = list(energies)
    logger.debug("[energies_by_subtype] returning %d items", len(result))
    return JsonResponse(result, safe=False)


def transport_subtypes(request):
    subtypes = (
        Transport.objects
        .exclude(subtype="")
        .values_list("subtype", flat=True)
        .distinct()
        .order_by("subtype")
    )
    result = list(subtypes)
    logger.debug("[transport_subtypes] returning %d subtypes: %s", len(result), result)
    return JsonResponse(result, safe=False)

def transports_by_subtype(request):
    subtype = request.GET.get("subtype", "")
    logger.debug("[transports_by_subtype] subtype param: '%s'", subtype)
    transports = (
        Transport.objects
        .filter(subtype=subtype)
        .values("id", "name", "short_name", "unit", "eco_cost", "carbon_kg")
        .order_by("name")
    )
    result = list(transports)
    logger.debug("[transports_by_subtype] returning %d items", len(result))
    return JsonResponse(result, safe=False)


def production_subtypes(request):
    subtypes = (
        Material.objects
        .exclude(subtype="")
        .values_list("subtype", flat=True)
        .distinct()
        .order_by("subtype")
    )
    result = list(subtypes)
    logger.debug("[material_subtypes] returning %d subtypes: %s", len(result), result)
    return JsonResponse(result, safe=False)

def productions_by_subtype(request):
    subtype = request.GET.get("subtype", "")
    logger.debug("[productions_by_subtype] subtype param: '%s'", subtype)
    materials = (
        Material.objects
        .filter(subtype=subtype)
        .values("id", "name", "short_name", "unit", "eco_cost", "carbon_kg")
        .order_by("name")
    )
    result = list(materials)
    logger.debug("[productions_by_subtype] returning %d items", len(result))
    return JsonResponse(result, safe=False)


def end_of_life_subtypes(request):
    subtypes = (
        Material.objects
        .exclude(subtype="")
        .values_list("subtype", flat=True)
        .distinct()
        .order_by("subtype")
    )
    result = list(subtypes)
    logger.debug("[material_subtypes] returning %d subtypes: %s", len(result), result)
    return JsonResponse(result, safe=False)

def end_of_life_by_subtype(request):
    subtype = request.GET.get("subtype", "")
    logger.debug("[end_of_life_by_subtype] subtype param: '%s'", subtype)
    materials = (
        Material.objects
        .filter(subtype=subtype)
        .values("id", "name", "short_name", "unit", "eco_cost", "carbon_kg")
        .order_by("name")
    )
    result = list(materials)
    logger.debug("[end_of_life_by_subtype] returning %d items", len(result))
    return JsonResponse(result, safe=False)


import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Product, Scenario, User


def get_user(request):
    """Helper: get user from session."""
    user_id = request.session.get('user_id')
    if not user_id:
        return None
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


def product_to_dict(product):
    return {
        'id':               product.id,
        'name':             product.name,
        'description':      product.description,
        'default_scenario_id': product.default_scenario_id,
        'default_scenario_name': product.default_scenario.name if product.default_scenario else None,
    }


# ── LIST + CREATE ─────────────────────────────────────────────────────────────

@csrf_exempt
def product_list_create(request):

    # GET /api/products/ → list all products for logged-in user
    if request.method == 'GET':
        user = get_user(request)
        if not user:
            return JsonResponse({'error': 'Not authenticated'}, status=401)

        products = Product.objects.filter(user=user).order_by('-id')
        return JsonResponse([product_to_dict(p) for p in products], safe=False)

    # POST /api/products/ → create a new product
    if request.method == 'POST':
        user = get_user(request)
        if not user:
            return JsonResponse({'error': 'Not authenticated'}, status=401)

        try:
            data = json.loads(request.body)
            name        = data.get('name', '').strip()
            description = data.get('description', '').strip()
            scenario_name = data.get('scenario_name', '').strip()

            if not name:
                return JsonResponse({'error': 'Product name is required'}, status=400)
            
            scenario = Scenario.objects.create(name=scenario_name)

            product = Product.objects.create(
                name=name,
                description=description,
                user=user,
                default_scenario=scenario       
             )
            return JsonResponse(product_to_dict(product), status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ── RETRIEVE + UPDATE + DELETE ────────────────────────────────────────────────

@csrf_exempt
def product_detail(request, product_id):

    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    try:
        product = Product.objects.get(id=product_id, user=user)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

    # GET /api/products/<id>/ → retrieve
    if request.method == 'GET':
        return JsonResponse(product_to_dict(product))

    # PUT /api/products/<id>/ → update
    if request.method == 'PUT':
        try:
            data        = json.loads(request.body)
            name        = data.get('name', product.name).strip()
            description = data.get('description', product.description).strip()
            scenario_id = data.get('default_scenario')

            if not name:
                return JsonResponse({'error': 'Product name is required'}, status=400)

            product.name        = name
            product.description = description

            if scenario_id:
                try:
                    product.default_scenario = Scenario.objects.get(id=scenario_id)
                except Scenario.DoesNotExist:
                    return JsonResponse({'error': 'Scenario not found'}, status=404)
            else:
                product.default_scenario = None

            product.save()
            return JsonResponse(product_to_dict(product))

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    # DELETE /api/products/<id>/ → delete
    if request.method == 'DELETE':
        scenario = product.default_scenario
        product.delete()
        if scenario:
            scenario.delete()
        return JsonResponse({'message': 'Product deleted successfully'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)

 
def scenario_to_dict(scenario, product):
    is_default = product.default_scenario_id == scenario.id
    return {
        'id':         scenario.id,
        'name':       scenario.name,
        'is_default': is_default,
    }

def scenario_entries_to_dict(scenario):
    """Return all saved entries for a scenario."""
    materials = list(
        ScenarioMaterial.objects.filter(scenario=scenario)
        .select_related('material')
        .values('id', 'material_id', 'material__name', 'material__subtype',
                'material__unit', 'quantity', 'is_packaging')
    )
    energies = list(
        ScenarioEnergy.objects.filter(scenario=scenario)
        .select_related('energy')
        .values('id', 'energy_id', 'energy__name', 'energy__subtype',
                'energy__unit', 'quantity')
    )
    transports = list(
        ScenarioTransport.objects.filter(scenario=scenario)
        .select_related('transport')
        .values('id', 'transport_id', 'transport__name', 'transport__subtype',
                'transport__unit', 'distance')
    )
    productions = list(
        ScenarioProduction.objects.filter(scenario=scenario)
        .select_related('production')
        .values('id', 'production_id', 'production__name', 'production__subtype',
                'production__unit', 'quantity')
    )
    end_of_lives = list(
        ScenarioEndOfLife.objects.filter(scenario=scenario)
        .select_related('end_of_life')
        .values('id', 'end_of_life_id', 'end_of_life__name', 'end_of_life__subtype',
                'end_of_life__unit', 'quantity')
    )
    return {
        'materials':    materials,
        'energies':     energies,
        'transports':   transports,
        'productions':  productions,
        'end_of_lives': end_of_lives,
    }
 
 
# ── LIST + CREATE scenarios for a product ────────────────────────────────────
 
@csrf_exempt
def scenario_list_create(request, product_id):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
 
    try:
        product = Product.objects.get(id=product_id, user=user)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
 
    # GET → list all scenarios for this product
    if request.method == 'GET':
        # Collect all scenario IDs linked to this product through junction tables
        scenario_ids = set()
        scenario_ids.update(ScenarioMaterial.objects.filter(scenario__in=_product_scenario_ids(product)).values_list('scenario_id', flat=True))
        scenario_ids.update(ScenarioEnergy.objects.filter(scenario__in=_product_scenario_ids(product)).values_list('scenario_id', flat=True))
        scenario_ids.update(ScenarioTransport.objects.filter(scenario__in=_product_scenario_ids(product)).values_list('scenario_id', flat=True))
 
        # Always include default scenario even if empty
        scenarios = Scenario.objects.filter(
            id__in=list(scenario_ids) + ([product.default_scenario_id] if product.default_scenario_id else [])
        ).distinct().order_by('id')
 
        return JsonResponse([scenario_to_dict(s, product) for s in scenarios], safe=False)
 
    # POST → create a new scenario for this product
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', '').strip()
            if not name:
                return JsonResponse({'error': 'Scenario name is required'}, status=400)
 
            scenario = Scenario.objects.create(name=name)
            return JsonResponse(scenario_to_dict(scenario, product), status=201)
 
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
 
    return JsonResponse({'error': 'Method not allowed'}, status=405)
 
 
def _product_scenario_ids(product):
    """Return all scenario IDs that belong to a product (default + any linked)."""
    ids = []
    if product.default_scenario_id:
        ids.append(product.default_scenario_id)
    return ids
 
 
# ── GET entries / SAVE entries / DELETE a scenario ───────────────────────────
 
@csrf_exempt
def scenario_detail(request, scenario_id):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
 
    try:
        scenario = Scenario.objects.get(id=scenario_id)
    except Scenario.DoesNotExist:
        return JsonResponse({'error': 'Scenario not found'}, status=404)
 
    # GET → return all saved entries for this scenario
    if request.method == 'GET':
        return JsonResponse(scenario_entries_to_dict(scenario))
 
    # DELETE → delete scenario + all linked entries (cascade)
    if request.method == 'DELETE':
        # Check it's not the product's default scenario being deleted
        # (caller should prevent this in UI, but guard here too)
        product = Product.objects.filter(default_scenario=scenario, user=user).first()
        if product:
            return JsonResponse(
                {'error': 'Cannot delete the default scenario. Delete the product instead.'},
                status=400
            )
        scenario.delete()   # CASCADE removes ScenarioMaterial, ScenarioEnergy, etc.
        return JsonResponse({'message': 'Scenario deleted'})
 
    return JsonResponse({'error': 'Method not allowed'}, status=405)
 
 
# ── SAVE all entries for a scenario (called on "Commencez le calcul") ─────────
 
@csrf_exempt
def scenario_save(request, scenario_id):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
 
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
 
    try:
        scenario = Scenario.objects.get(id=scenario_id)
    except Scenario.DoesNotExist:
        return JsonResponse({'error': 'Scenario not found'}, status=404)
 
    try:
        data = json.loads(request.body)
 
        # ── 1. Clear existing entries ──
        ScenarioMaterial.objects.filter(scenario=scenario).delete()
        ScenarioEnergy.objects.filter(scenario=scenario).delete()
        ScenarioTransport.objects.filter(scenario=scenario).delete()
        ScenarioProduction.objects.filter(scenario=scenario).delete()
        ScenarioEndOfLife.objects.filter(scenario=scenario).delete()
 
        mat_eco   = mat_co2   = 0.0
        trans_eco = trans_co2 = 0.0
        ener_eco  = ener_co2  = 0.0
        prod_eco  = prod_co2  = 0.0
        eol_eco   = eol_co2   = 0.0
 
        # ── 2. Materials ──
        for item in data.get('materials', []):
            mat = Material.objects.get(id=item['material_id'])
            qty = float(item.get('quantity', 0))
            is_packaging = item.get('is_packaging', False)   # ← read the flag
            ScenarioMaterial.objects.create(
                scenario=scenario,
                material=mat,
                quantity=qty,
                is_packaging=is_packaging,                   # ← save the flag
            )
            mat_eco += mat.eco_cost  * qty
            mat_co2 += mat.carbon_kg * qty
 
        # ── 3. Energies ──
        for item in data.get('energies', []):
            en  = Energy.objects.get(id=item['energy_id'])
            qty = float(item.get('quantity', 0))
            ScenarioEnergy.objects.create(scenario=scenario, energy=en, quantity=qty)
            ener_eco += en.eco_cost  * qty
            ener_co2 += en.carbon_kg * qty
 
        # ── 4. Transports ──
        for item in data.get('transports', []):
            tr   = Transport.objects.get(id=item['transport_id'])
            dist = float(item.get('distance', 0))
            ScenarioTransport.objects.create(scenario=scenario, transport=tr, distance=dist)
            trans_eco += tr.eco_cost  * dist
            trans_co2 += tr.carbon_kg * dist
 
        # ── 5. Productions ──
        for item in data.get('productions', []):
            pr  = Production.objects.get(id=item['production_id'])
            qty = float(item.get('quantity', 0))
            ScenarioProduction.objects.create(scenario=scenario, production=pr, quantity=qty)
            prod_eco += pr.eco_cost  * qty
            prod_co2 += pr.carbon_kg * qty
 
        # ── 6. End of life ──
        for item in data.get('end_of_lives', []):
            eol = EndOfLife.objects.get(id=item['end_of_life_id'])
            qty = float(item.get('quantity', 0))
            ScenarioEndOfLife.objects.create(scenario=scenario, end_of_life=eol, quantity=qty)
            eol_eco += eol.eco_cost  * qty
            eol_co2 += eol.carbon_kg * qty
 
        total_eco_cost  = mat_eco + trans_eco + ener_eco + prod_eco + eol_eco
        total_carbon_kg = mat_co2 + trans_co2 + ener_co2 + prod_co2 + eol_co2

        # ── 7. Save ImpactResult ──
        product = Product.objects.filter(default_scenario=scenario, user=user).first()
        if not product:
            # Try to find by any scenario link
            product = Product.objects.filter(user=user).first()
 
        if product:
           ImpactResult.objects.update_or_create(
                scenario=scenario,
                product=product,
                defaults={
                    'total_eco_cost':  round(total_eco_cost,  4),
                    'total_carbon_kg': round(total_carbon_kg, 4),
                }
            )
 
        return JsonResponse({
            'message':         'Scenario saved and calculated',
            'total_eco_cost':  round(total_eco_cost,  4),
            'total_carbon_kg': round(total_carbon_kg, 4),
            'breakdown': {
                'materiaux':  round(mat_eco,   4),
                'transport':  round(trans_eco, 4),
                'energie':    round(ener_eco,  4),
                'production': round(prod_eco,  4),
                'fin_de_vie': round(eol_eco,   4),
            },
            'carbon_breakdown': {
                'materiaux':  round(mat_co2,   4),
                'transport':  round(trans_co2, 4),
                'energie':    round(ener_co2,  4),
                'production': round(prod_co2,  4),
                'fin_de_vie': round(eol_co2,   4),
            }
        })
 
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)