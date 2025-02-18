import requests
import os
from datetime import datetime
from models import DeliveryOrder, db

class WhatsAppIntegration:
    def __init__(self):
        self.api_url = os.environ.get('WHATSAPP_API_URL')
        self.api_token = os.environ.get('WHATSAPP_API_TOKEN')
    
    def format_phone_number(self, phone):
        """Format phone number to international format"""
        # Remove any non-numeric characters
        clean_number = ''.join(filter(str.isdigit, phone))
        
        # Add country code if not present
        if not clean_number.startswith('549'):
            clean_number = f"549{clean_number}"
        
        return clean_number
    
    def send_payment_link(self, delivery_order):
        """Send payment link via WhatsApp"""
        try:
            if not delivery_order.mp_payment_link:
                return False, "No payment link available"
            
            # Format the customer's phone number
            phone = self.format_phone_number(delivery_order.address.phone)
            
            # Create the message
            message = (
                f"¡Gracias por tu pedido #{delivery_order.id}! 🍦\n\n"
                f"Para completar tu compra, por favor realiza el pago a través del siguiente enlace:\n"
                f"{delivery_order.mp_payment_link}\n\n"
                f"Una vez confirmado el pago, comenzaremos a preparar tu pedido."
            )
            
            # Send the message via WhatsApp API
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'phone': phone,
                'message': message
            }
            
            response = requests.post(self.api_url, json=data, headers=headers)
            
            if response.status_code == 200:
                # Update delivery order
                delivery_order.payment_sent_via_whatsapp = True
                delivery_order.payment_sent_at = datetime.utcnow()
                db.session.commit()
                return True, "Payment link sent successfully"
            
            return False, f"Error sending WhatsApp message: {response.text}"
            
        except Exception as e:
            return False, str(e)
    
    def send_delivery_status(self, delivery_order):
        """Send delivery status update via WhatsApp"""
        try:
            phone = self.format_phone_number(delivery_order.address.phone)
            status = delivery_order.current_status
            
            # Create status-specific messages
            status_messages = {
                'En Preparación': '¡Tu pedido está siendo preparado! 👨‍🍳',
                'En Camino': '¡Tu pedido está en camino! 🛵',
                'Entregado': '¡Tu pedido ha sido entregado! Gracias por tu compra 😊',
                'Cancelado': 'Lo sentimos, tu pedido ha sido cancelado.'
            }
            
            message = (
                f"Actualización de tu pedido #{delivery_order.id}:\n\n"
                f"{status_messages.get(status.name, status.name)}\n"
            )
            
            # Add estimated time if available
            if delivery_order.estimated_delivery_time and status.name == 'En Camino':
                eta = delivery_order.estimated_delivery_time.strftime('%H:%M')
                message += f"\nTiempo estimado de llegada: {eta} hs"
            
            # Send the message
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'phone': phone,
                'message': message
            }
            
            response = requests.post(self.api_url, json=data, headers=headers)
            
            return response.status_code == 200, response.text
            
        except Exception as e:
            return False, str(e)

# Create a singleton instance
whatsapp = WhatsAppIntegration()
