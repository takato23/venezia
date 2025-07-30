# Real-Time Notification System - Venezia Ice Cream Shop

A comprehensive real-time notification system providing instant alerts and updates across the application.

## 🏗️ Architecture

### Backend Services
- **NotificationService** (`backend/services/notificationService.js`) - Core service managing all notifications
- **ScheduledNotifications** (`backend/services/scheduledNotifications.js`) - Automated daily/weekly reports and alerts
- **Integration Layer** - Connects with existing services (AlertService, MercadoPago, Sales, Inventory)

### Frontend Components
- **useNotifications** (`src/hooks/useNotifications.js`) - React hook for notification management
- **NotificationBell** - Header notification icon with unread count
- **NotificationPanel** - Dropdown panel with notification list and filters
- **NotificationItem** - Individual notification display component
- **NotificationPreferences** - User preference management interface

### Database Schema
- **notifications** - Main notification storage
- **notification_preferences** - User-specific settings
- **notification_templates** - Reusable notification formats

## 🔔 Notification Types

### Inventory Alerts
- **Low Stock** - When products fall below minimum threshold
- **Out of Stock** - When products are completely depleted
- **Expiration Warning** - Products nearing expiration date

### Sales & Orders
- **New Order** - When a new sale is processed
- **Order Ready** - When orders are ready for pickup/delivery
- **Sales Milestones** - Daily goals and record achievements

### Equipment Monitoring
- **Temperature Warning** - Freezer/equipment temperature alerts
- **Temperature Critical** - Critical temperature violations

### Payments
- **Payment Success** - Successful payment confirmations
- **Payment Failed** - Failed payment alerts

### Production
- **Batch Completed** - Production batch completion notices

### System Alerts
- **Maintenance** - System maintenance notifications
- **Updates** - New feature announcements

## ⚙️ Features

### Real-Time Delivery
- **Socket.IO Integration** - Instant notification delivery
- **Room-based Broadcasting** - User, store, and role-specific notifications
- **Connection Management** - Automatic reconnection and heartbeat monitoring
- **Multi-tab Support** - Synchronized across browser tabs

### User Preferences
- **Granular Controls** - Enable/disable by notification type
- **Sound Settings** - Audio alerts with priority-based sounds
- **Quiet Hours** - Scheduled do-not-disturb periods
- **Push/Email Options** - Multiple delivery channels

### Smart Features
- **Priority Levels** - Critical, High, Medium, Low with appropriate styling
- **Auto-read Tracking** - Mark notifications as read automatically
- **Bulk Actions** - Mark all as read functionality
- **Filtering** - Filter by type, priority, read status
- **Search & Sort** - Find specific notifications quickly

### Queue Management
- **Reliability** - Retry mechanism with exponential backoff
- **Persistence** - Database storage for notification history
- **Performance** - Efficient queue processing with batching

## 🚀 Integration Points

### Sales System
```javascript
// Automatically triggered on new sales
notificationService.notifyNewOrder({
  order_number: 'VEN-000123',
  customer_name: 'Juan Pérez',
  total_amount: 15000
});
```

### Inventory Management
```javascript
// Triggered when stock levels change
notificationService.notifyLowStock(product, currentStock, minimumStock);
notificationService.notifyOutOfStock(product);
```

### Payment Processing
```javascript
// MercadoPago webhook integration
notificationService.notifyPaymentSuccess(payment, order);
notificationService.createNotification('payment_failed', {...});
```

### Alert Service Integration
```javascript
// Existing AlertService now sends notifications
alertService.checkLowStock(); // Triggers stock notifications
```

## 📅 Scheduled Notifications

### Daily Reports (10 PM)
- Sales summary with growth comparison
- Record day detection and celebration
- Key metrics and insights

### Expiration Checks (8 AM Daily)
- Products expiring within 7 days
- Batch-specific expiration warnings
- Priority-based alert levels

### Weekly Reports (Monday 9 AM)
- Inventory health summary
- Stock level statistics
- Maintenance recommendations

### Hourly Milestones
- Sales achievement notifications
- Performance milestone celebrations
- Goal tracking updates

## 🔧 Configuration

### Environment Variables
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Notification Settings
NOTIFICATION_CLEANUP_DAYS=30
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_QUEUE_BATCH_SIZE=10
```

### Notification Templates
Templates are stored in the database and can be customized:
```sql
UPDATE notification_templates 
SET message_template = 'El producto {product} tiene stock crítico: {current} unidades'
WHERE type = 'low_stock';
```

## 📱 Frontend Usage

### Basic Implementation
```jsx
import { useNotifications } from './hooks/useNotifications';
import { NotificationBell } from './components/notifications';

function Header() {
  const { unreadCount, isConnected } = useNotifications();
  
  return (
    <header>
      <NotificationBell />
      <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
    </header>
  );
}
```

### Custom Notification Handling
```jsx
const { notifications, markAsRead, filterNotifications } = useNotifications();

// Filter critical notifications
const criticalAlerts = notifications.filter(n => n.priority === 'critical');

// Mark specific notification as read
const handleNotificationClick = (notification) => {
  markAsRead(notification.id);
  // Handle notification action...
};
```

## 🔒 Security & Permissions

### Row Level Security (RLS)
- Users see only their own notifications
- Admin users can see store-wide notifications
- Role-based notification access

### Data Protection
- No sensitive data in notification content
- Secure WebSocket connections
- Encrypted notification storage

## 📊 Performance

### Optimization Features
- **Connection Pooling** - Efficient Socket.IO connection management
- **Queue Batching** - Process multiple notifications efficiently
- **Caching** - Redis-style caching for frequent queries
- **Cleanup Jobs** - Automatic removal of old notifications

### Monitoring
- Connection status indicators
- Failed notification tracking
- Performance metrics logging
- Error recovery mechanisms

## 🧪 Testing

### Manual Testing
1. Create a test sale → Should receive "New Order" notification
2. Update product stock to 0 → Should receive "Out of Stock" notification
3. Process a payment → Should receive "Payment Success" notification
4. Check notification preferences → Should persist settings

### Automated Testing
```bash
# Run notification system tests
npm test -- --grep "notification"
```

## 📈 Future Enhancements

### Planned Features
- **Email Notifications** - SMTP integration for email alerts
- **Mobile Push** - Native mobile app push notifications
- **Webhook Support** - External system integrations
- **Analytics Dashboard** - Notification engagement metrics
- **Advanced Filtering** - Complex query capabilities
- **Notification Scheduling** - User-defined notification timing

### Scalability Improvements
- **Message Queuing** - Redis/RabbitMQ for high-volume scenarios
- **Microservice Architecture** - Separate notification service
- **Load Balancing** - Multiple notification service instances
- **Database Sharding** - Partition notifications by store/date

## 🆘 Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. Check Socket.IO connection status
2. Verify user is in correct notification rooms
3. Check notification preferences
4. Inspect browser console for errors

#### Connection Issues
1. Verify server is running on correct port
2. Check CORS configuration
3. Test WebSocket connectivity
4. Review firewall settings

#### Performance Issues
1. Monitor notification queue size
2. Check database connection pool
3. Review notification cleanup job
4. Optimize Socket.IO room management

### Debug Commands
```bash
# Check notification service status
curl http://localhost:5002/api/notifications/unread-count

# Test Socket.IO connection
wscat -c ws://localhost:5002

# Monitor notification queue
tail -f logs/notification-service.log
```

## 📚 API Reference

### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

### Socket.IO Events
- `notification:new` - New notification received
- `notification:read` - Notification marked as read
- `notifications:all:read` - All notifications marked as read
- `heartbeat` - Connection health check
- `join:notifications` - Join notification rooms

This notification system provides a robust, scalable foundation for real-time communication in the Venezia Ice Cream Shop application, ensuring users stay informed about critical business events and system status changes.