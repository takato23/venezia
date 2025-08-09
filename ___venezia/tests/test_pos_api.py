import os
import json
from datetime import datetime, timedelta

# Configure test DB before importing app
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_pos_api.db'

from ___venezia.app import app, init_db, bank_round  # noqa: E402
from ___venezia.extensions import db  # noqa: E402
from ___venezia.models import Product, Store, AdminCode, Sale  # noqa: E402


def setup_module(module):
    with app.app_context():
        # Fresh DB
        db.drop_all()
        db.create_all()
        init_db()


def teardown_module(module):
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_bank_rounding():
    assert bank_round(10.005) == 10.0
    assert bank_round(10.015) == 10.02
    assert bank_round(10.025) == 10.02


def test_products_pagination_and_filters():
    client = app.test_client()
    # Ensure store exists
    with app.app_context():
        store = Store.query.first()
        assert store is not None
        store_id = store.id

    resp = client.get(f'/api/products?store_id={store_id}&page=1&pageSize=24')
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['success'] is True
    assert 'items' in body['data']
    assert 'total' in body['data']
    # Search filter
    resp = client.get(f'/api/products?store_id={store_id}&search=agua')
    assert resp.status_code == 200


def test_admin_code_validate_valid_and_invalid():
    client = app.test_client()
    with app.app_context():
        store = Store.query.first()
        assert store is not None
        valid = AdminCode.query.filter_by(code='ABC123').first()
        assert valid is not None

    # Valid
    resp = client.post('/api/admin/admin_codes/validate', json={'code': 'ABC123', 'store_id': store.id})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['success'] is True
    assert body['data']['kind'] in ('percent', 'amount')

    # Invalid code
    resp = client.post('/api/admin/admin_codes/validate', json={'code': 'NOPE', 'store_id': store.id})
    assert resp.status_code in (400, 404)
    body = resp.get_json()
    assert body['success'] is False

    # Expired
    with app.app_context():
        expired = AdminCode(code='EXP_TEST', kind='percent', value=5, description='exp', expires_at=datetime.utcnow() - timedelta(days=1))
        db.session.add(expired)
        db.session.commit()
    resp = client.post('/api/admin/admin_codes/validate', json={'code': 'EXP_TEST', 'store_id': store.id})
    assert resp.status_code == 400


def test_sales_create_with_and_without_admin_code_and_idempotency():
    client = app.test_client()
    with app.app_context():
        store = Store.query.first()
        assert store is not None
        prod = Product.query.filter(Product.active == True).first()
        assert prod is not None

    # Without admin code
    sale_payload = {
        'store_id': store.id,
        'items': [
            {'product_id': prod.id, 'qty': 2},
        ]
    }
    resp = client.post('/api/sales', json=sale_payload)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['success'] is True
    sale_number_1 = body['data']['sale_number']

    # With admin code
    resp = client.post('/api/admin/admin_codes/validate', json={'code': 'ABC123', 'store_id': store.id})
    assert resp.status_code == 200
    sale_payload2 = {
        'store_id': store.id,
        'items': [
            {'product_id': prod.id, 'qty': 1},
        ],
        'admin_code': 'ABC123',
        'client_idempotency_key': 'pos-xyz-1'
    }
    resp2 = client.post('/api/sales', json=sale_payload2)
    assert resp2.status_code == 200
    body2 = resp2.get_json()
    assert body2['success'] is True
    # Repeat idempotent request
    resp3 = client.post('/api/sales', json=sale_payload2)
    assert resp3.status_code == 200
    body3 = resp3.get_json()
    assert body3['data']['sale_number'] == body2['data']['sale_number']

    # Edge: qty <= 0
    resp = client.post('/api/sales', json={'store_id': store.id, 'items': [{'product_id': prod.id, 'qty': 0}]})
    assert resp.status_code == 400

    # Edge: missing store_id
    resp = client.post('/api/sales', json={'items': [{'product_id': prod.id, 'qty': 1}]})
    assert resp.status_code == 400