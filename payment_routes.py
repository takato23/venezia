from flask import Blueprint, request, jsonify, redirect, url_for
from models import DeliveryOrder, db
from mercadopago_integration import mp_integration
from whatsapp_integration import whatsapp

payment = Blueprint('payment', __name__)

@payment.route('/create_payment/<int:delivery_id>', methods=['POST'])
def create_payment(delivery_id):
    """Create a new payment preference and send payment link via WhatsApp"""
    try:
        delivery_order = DeliveryOrder.query.get_or_404(delivery_id)
        
        # Create MercadoPago preference
        success, result = mp_integration.create_preference(delivery_order)
        
        if not success:
            return jsonify({'error': result}), 400
        
        # Send payment link via WhatsApp
        whatsapp_success, whatsapp_result = whatsapp.send_payment_link(delivery_order)
        
        if not whatsapp_success:
            return jsonify({'warning': f'Payment link created but WhatsApp message failed: {whatsapp_result}',
                          'payment_link': result}), 200
        
        return jsonify({'message': 'Payment link created and sent successfully',
                       'payment_link': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment.route('/send_payment/<int:delivery_id>', methods=['POST'])
def send_payment(delivery_id):
    """Send payment link via WhatsApp"""
    try:
        delivery_order = DeliveryOrder.query.get_or_404(delivery_id)
        
        if not delivery_order.mp_payment_link:
            return jsonify({'error': 'No payment link available'}), 400
            
        # Send payment link via WhatsApp
        success, result = whatsapp.send_payment_link(delivery_order)
        
        if not success:
            return jsonify({'error': result}), 400
        
        return jsonify({'message': 'Payment link sent successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment.route('/webhook', methods=['POST'])
def webhook():
    """Handle MercadoPago webhook notifications"""
    try:
        data = request.get_json()
        
        # Process the webhook data
        success, message = mp_integration.process_webhook(data)
        
        if not success:
            return jsonify({'error': message}), 400
        
        # If payment was processed successfully, update sale status
        if data["type"] == "payment":
            payment_info = mp_integration.mp.payment().get(data["data"]["id"])
            
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                
                # Get the delivery order from the external reference
                delivery_order = DeliveryOrder.query.get(int(payment["external_reference"]))
                
                if delivery_order:
                    # Update delivery order payment information
                    delivery_order.mp_payment_id = str(payment["id"])
                    delivery_order.mp_status = payment["status"]
                    
                    # Update sale payment status
                    delivery_order.sale.payment_status = payment["status"]
                    
                    # If payment is approved, update delivery status
                    if payment["status"] == "approved":
                        delivery_order.update_status(2)  # Change to "En Preparación"
                    
                    db.session.commit()
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment.route('/status/<string:payment_id>')
def payment_status(payment_id):
    """Get the current status of a payment"""
    try:
        success, status = mp_integration.get_payment_status(payment_id)
        
        if not success:
            return jsonify({'error': status}), 400
        
        return jsonify({'status': status}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment.route('/success')
def payment_success():
    """Handle successful payment redirect"""
    # You can customize this to show a success page or redirect to the order status
    return redirect(url_for('delivery.order_status'))

@payment.route('/failure')
def payment_failure():
    """Handle failed payment redirect"""
    # You can customize this to show an error page or redirect to retry payment
    return redirect(url_for('delivery.order_status'))

@payment.route('/pending')
def payment_pending():
    """Handle pending payment redirect"""
    # You can customize this to show a pending page or redirect to order status
    return redirect(url_for('delivery.order_status'))
