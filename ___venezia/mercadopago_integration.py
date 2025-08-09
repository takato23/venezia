import os
import mercadopago
from datetime import datetime, timedelta
from models import DeliveryOrder, Sale, db

class MercadoPagoIntegration:
    def __init__(self):
        access_token = os.environ.get('MERCADOPAGO_ACCESS_TOKEN')
        if not access_token:
            print("Warning: MERCADOPAGO_ACCESS_TOKEN not set. MercadoPago integration will be disabled.")
            access_token = "TEST-0000000000000000-000000-00000000000000000000000000000000-000000000"
            self.is_configured = False
        else:
            self.is_configured = True
        self.mp = mercadopago.SDK(access_token)
        
    def create_preference(self, order_or_sale):
        """Create a MercadoPago preference for a delivery order or sale"""
        if not self.is_configured:
            return False, "MercadoPago is not configured. Please set MERCADOPAGO_ACCESS_TOKEN."
            
        try:
            # Determine if this is a delivery order or direct sale
            if hasattr(order_or_sale, 'sale'):
                # It's a delivery order
                sale = order_or_sale.sale
                title = f"Pedido de Helado #{order_or_sale.id}"
                description = f"Pedido para {order_or_sale.address.customer_name}"
                external_ref = str(order_or_sale.id)
                success_url = f"{os.environ.get('BASE_URL')}/delivery/payment/success"
                failure_url = f"{os.environ.get('BASE_URL')}/delivery/payment/failure"
                pending_url = f"{os.environ.get('BASE_URL')}/delivery/payment/pending"
            else:
                # It's a direct sale
                sale = order_or_sale
                title = f"Venta #{sale.id}"
                description = "Venta en tienda"
                external_ref = str(sale.id)
                success_url = f"{os.environ.get('BASE_URL')}/payment/success"
                failure_url = f"{os.environ.get('BASE_URL')}/payment/failure"
                pending_url = f"{os.environ.get('BASE_URL')}/payment/pending"
            
            # Create the preference data
            preference_data = {
                "items": [
                    {
                        "title": title,
                        "quantity": 1,
                        "currency_id": "ARS",  # Argentine Peso
                        "unit_price": float(sale.total_amount),
                        "description": description
                    }
                ],
                "external_reference": external_ref,
                "notification_url": os.environ.get('MERCADOPAGO_WEBHOOK_URL'),
                "back_urls": {
                    "success": success_url,
                    "failure": failure_url,
                    "pending": pending_url
                },
                "payment_methods": {
                    "excluded_payment_types": [{"id": "ticket"}],  # Exclude payment types that don't support QR
                    "installments": 1  # No installments for food orders
                },
                "statement_descriptor": "Venezia Helados",
                "expires": True,
                "expiration_date_to": (datetime.now() + timedelta(hours=24)).isoformat()
            }
            
            # Create the preference
            preference_response = self.mp.preference().create(preference_data)
            
            if preference_response["status"] == 201:
                response = preference_response["response"]
                response_data = {
                    "id": response["id"],
                    "payment_link": response["init_point"],
                    "qr_code": response.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code")
                }
                
                if hasattr(order_or_sale, 'sale'):
                    # Update delivery order with payment info
                    order_or_sale.mp_preference_id = response_data["id"]
                    order_or_sale.mp_payment_link = response_data["payment_link"]
                    order_or_sale.mp_qr_link = response_data["qr_code"]
                    order_or_sale.mp_status = "pending"
                    order_or_sale.mp_created_at = datetime.now()
                    db.session.commit()
                
                return True, response_data
            
            return False, "Error creating MercadoPago preference"
            
        except Exception as e:
            return False, str(e)
            
    def create_delivery_preference(self, delivery_order, sale=None):
        """Create a MercadoPago preference for a delivery order"""
        return self.create_preference(delivery_order)
        
    def create_sale_preference(self, sale):
        """Create a MercadoPago preference for a regular (non-delivery) sale"""
        return self.create_preference(sale)

    def process_webhook(self, data):
        """Process webhook notifications from MercadoPago"""
        if not self.is_configured:
            return False, "MercadoPago is not configured. Please set MERCADOPAGO_ACCESS_TOKEN."
            
        try:
            if data["type"] == "payment":
                payment_id = data["data"]["id"]
                payment_info = self.mp.payment().get(payment_id)
                
                if payment_info["status"] == 200:
                    payment = payment_info["response"]
                    delivery_id = int(payment["external_reference"])
                    delivery = DeliveryOrder.query.get(delivery_id)
                    
                    if delivery:
                        delivery.mp_payment_id = str(payment["id"])
                        delivery.mp_status = payment["status"]
                        delivery.mp_payment_type = payment.get("payment_type_id")
                        delivery.mp_payment_method = payment.get("payment_method_id")
                        delivery.mp_card_last_four = payment.get("card", {}).get("last_four_digits")
                        delivery.mp_rejection_reason = payment.get("status_detail")
                        if payment["status"] == "approved":
                            delivery.mp_approved_at = datetime.now()
                        delivery.mp_last_updated = datetime.now()
                        # Update linked sale as well if exists
                        if delivery.sale:
                            delivery.sale.mp_payment_id = str(payment["id"])
                            delivery.sale.mp_status = payment["status"]
                            delivery.sale.mp_payment_type = payment.get("payment_type_id")
                            delivery.sale.mp_payment_method = payment.get("payment_method_id")
                            if payment["status"] == "approved":
                                delivery.sale.mp_approved_at = datetime.now()
                            delivery.sale.mp_last_updated = datetime.now()
                            delivery.sale.payment_status = payment["status"]
                        db.session.commit()
                        return True, "Payment status updated"
                    # If not a delivery, try direct sale by external reference
                    sale = Sale.query.get(delivery_id)
                    if sale:
                        sale.mp_payment_id = str(payment["id"])
                        sale.mp_status = payment["status"]
                        sale.mp_payment_type = payment.get("payment_type_id")
                        sale.mp_payment_method = payment.get("payment_method_id")
                        sale.mp_card_last_four = payment.get("card", {}).get("last_four_digits")
                        sale.mp_rejection_reason = payment.get("status_detail")
                        if payment["status"] == "approved":
                            sale.mp_approved_at = datetime.now()
                        sale.mp_last_updated = datetime.now()
                        sale.payment_status = payment["status"]
                        db.session.commit()
                        return True, "Payment status updated"
                    return False, "Order/Sale not found"
                
                return False, "Error getting payment information"
            
            return True, "Non-payment webhook received"
            
        except Exception as e:
            return False, str(e)

    def get_payment_status(self, payment_id):
        """Get the current status of a payment"""
        if not self.is_configured:
            return False, "MercadoPago is not configured. Please set MERCADOPAGO_ACCESS_TOKEN."
            
        try:
            payment_info = self.mp.payment().get(payment_id)
            
            if payment_info["status"] == 200:
                return True, payment_info["response"]["status"]
            
            return False, "Error getting payment status"
            
        except Exception as e:
            return False, str(e)

    def get_status_by_external_reference(self, external_reference: str):
        """Search payments by external_reference and return latest status and payment id."""
        if not self.is_configured:
            return False, "MercadoPago is not configured. Please set MERCADOPAGO_ACCESS_TOKEN."
        try:
            search_params = {"external_reference": str(external_reference), "sort": "date_created", "criteria": "desc"}
            result = self.mp.payment().search(search_params)
            if result.get("status") == 200:
                results = result.get("response", {}).get("results", [])
                if results:
                    payment = results[0]["collection"] if "collection" in results[0] else results[0]
                    payment_id = str(payment.get("id"))
                    status = payment.get("status")
                    return True, {"payment_id": payment_id, "status": status}
            return False, "No payments found"
        except Exception as e:
            return False, str(e)

# Create a singleton instance
mp_integration = MercadoPagoIntegration()
