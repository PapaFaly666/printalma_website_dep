# Guide d'Implémentation : Système de Notifications Backend

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation d'un système de notifications persistant côté backend pour remplacer le système frontend actuel qui disparaît lors des actualisations.

## 🗃️ 1. Structure de Base de Données

### Table `notifications`

```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('order_new', 'order_updated', 'system', 'success', 'warning', 'error') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Exemple de métadonnées JSON
```json
{
    "orderId": 123,
    "orderNumber": "CMD-2024-001",
    "amount": 150000,
    "customer": "Jean Dupont",
    "avatar": "/avatars/user-123.jpg"
}
```

## 🏗️ 2. Modèle Notification (Backend)

### Entity/Model (Laravel/PHP)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'is_read',
        'metadata',
        'expires_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeNotExpired($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Méthodes utilitaires
    public function markAsRead(): bool
    {
        return $this->update(['is_read' => true]);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
```

## 🎯 3. Service de Notifications

### NotificationService

```php
<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Créer une nouvelle notification
     */
    public function create(array $data): Notification
    {
        return Notification::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'metadata' => $data['metadata'] ?? null,
            'expires_at' => $data['expires_at'] ?? null
        ]);
    }

    /**
     * Notification pour nouvelle commande
     */
    public function notifyNewOrder(int $userId, array $orderData): Notification
    {
        $customer = $orderData['customer_name'] ?? 'Client';
        $itemsCount = $orderData['items_count'] ?? 0;
        $products = $orderData['products'] ?? 'Produits non spécifiés';

        return $this->create([
            'user_id' => $userId,
            'type' => 'order_new',
            'title' => 'Nouvelle commande reçue',
            'message' => "{$customer} a passé une commande de {$itemsCount} article" . 
                        ($itemsCount > 1 ? 's' : '') . " : {$products}",
            'metadata' => [
                'orderId' => $orderData['id'],
                'orderNumber' => $orderData['order_number'],
                'amount' => $orderData['total_amount'],
                'customer' => $customer
            ]
        ]);
    }

    /**
     * Notification pour mise à jour commande
     */
    public function notifyOrderUpdate(int $userId, array $orderData, string $newStatus): Notification
    {
        return $this->create([
            'user_id' => $userId,
            'type' => 'order_updated',
            'title' => 'Commande mise à jour',
            'message' => "Statut modifié vers \"{$newStatus}\"",
            'metadata' => [
                'orderId' => $orderData['id'],
                'orderNumber' => $orderData['order_number'],
                'amount' => $orderData['total_amount'],
                'customer' => $orderData['customer_name'] ?? 'Client'
            ]
        ]);
    }

    /**
     * Notification système
     */
    public function notifySystem(int $userId, string $title, string $message, array $metadata = []): Notification
    {
        return $this->create([
            'user_id' => $userId,
            'type' => 'system',
            'title' => $title,
            'message' => $message,
            'metadata' => $metadata
        ]);
    }

    /**
     * Récupérer les notifications d'un utilisateur
     */
    public function getUserNotifications(int $userId, int $limit = 50): Collection
    {
        return Notification::forUser($userId)
            ->notExpired()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Marquer comme lue
     */
    public function markAsRead(int $notificationId): bool
    {
        $notification = Notification::find($notificationId);
        return $notification ? $notification->markAsRead() : false;
    }

    /**
     * Marquer toutes comme lues pour un utilisateur
     */
    public function markAllAsRead(int $userId): bool
    {
        return Notification::forUser($userId)
            ->unread()
            ->update(['is_read' => true]) > 0;
    }

    /**
     * Supprimer les notifications expirées
     */
    public function cleanExpired(): int
    {
        return Notification::where('expires_at', '<', now())->delete();
    }

    /**
     * Compter les non lues
     */
    public function getUnreadCount(int $userId): int
    {
        return Notification::forUser($userId)
            ->unread()
            ->notExpired()
            ->count();
    }
}
```

## 🔗 4. Contrôleur API

### NotificationController

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Récupérer les notifications de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 50);
        $notifications = $this->notificationService->getUserNotifications(
            $request->user()->id,
            $limit
        );

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $this->notificationService->getUnreadCount($request->user()->id)
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $success = $this->notificationService->markAsRead($id);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Notification marquée comme lue' : 'Notification non trouvée'
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $updated = $this->notificationService->markAllAsRead($request->user()->id);

        return response()->json([
            'success' => true,
            'message' => "Toutes les notifications ont été marquées comme lues",
            'updated_count' => $updated
        ]);
    }

    /**
     * Compter les notifications non lues
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount($request->user()->id);

        return response()->json([
            'success' => true,
            'unread_count' => $count
        ]);
    }

    /**
     * Supprimer une notification
     */
    public function destroy(int $id): JsonResponse
    {
        $notification = Notification::find($id);
        
        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée'
        ]);
    }
}
```

## 🛠️ 5. Intégration avec les Commandes

### OrderService (Ajout des notifications)

```php
<?php

namespace App\Services;

use App\Models\Order;
use App\Services\NotificationService;

class OrderService
{
    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Créer une nouvelle commande
     */
    public function createOrder(array $data): Order
    {
        $order = Order::create($data);

        // Notifier tous les admins
        $this->notifyAdminsNewOrder($order);

        return $order;
    }

    /**
     * Mettre à jour le statut d'une commande
     */
    public function updateOrderStatus(int $orderId, string $newStatus): Order
    {
        $order = Order::findOrFail($orderId);
        $oldStatus = $order->status;
        
        $order->update(['status' => $newStatus]);

        // Notifier les admins du changement
        if ($oldStatus !== $newStatus) {
            $this->notifyAdminsOrderUpdate($order, $newStatus);
        }

        return $order;
    }

    /**
     * Notifier tous les admins d'une nouvelle commande
     */
    private function notifyAdminsNewOrder(Order $order): void
    {
        $admins = User::whereIn('role', ['ADMIN', 'SUPERADMIN'])->get();
        
        $orderData = [
            'id' => $order->id,
            'order_number' => $order->orderNumber,
            'total_amount' => $order->totalAmount,
            'customer_name' => $order->user->firstName . ' ' . $order->user->lastName,
            'items_count' => $order->orderItems->count(),
            'products' => $order->orderItems->take(2)->pluck('product.name')->join(', ')
        ];

        foreach ($admins as $admin) {
            $this->notificationService->notifyNewOrder($admin->id, $orderData);
        }
    }

    /**
     * Notifier les admins d'une mise à jour de commande
     */
    private function notifyAdminsOrderUpdate(Order $order, string $newStatus): void
    {
        $admins = User::whereIn('role', ['ADMIN', 'SUPERADMIN'])->get();
        
        $orderData = [
            'id' => $order->id,
            'order_number' => $order->orderNumber,
            'total_amount' => $order->totalAmount,
            'customer_name' => $order->user->firstName . ' ' . $order->user->lastName
        ];

        foreach ($admins as $admin) {
            $this->notificationService->notifyOrderUpdate($admin->id, $orderData, $newStatus);
        }
    }
}
```

## 🔀 6. Routes API

### routes/api.php

```php
<?php

use App\Http\Controllers\Api\NotificationController;

Route::middleware(['auth:sanctum'])->group(function () {
    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });
});
```

## ⚡ 7. WebSocket/Broadcasting (Optionnel)

### Event de notification en temps réel

```php
<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Notification $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification->user_id)
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => $this->notification->toArray()
        ];
    }
}
```

## 📱 8. Service Frontend (TypeScript)

### notificationService.ts

```typescript
class NotificationService {
  private baseUrl = '/api/notifications';

  async getNotifications(limit = 50): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    const response = await fetch(`${this.baseUrl}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return {
      notifications: data.data,
      unreadCount: data.unread_count
    };
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.success;
  }

  async markAllAsRead(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/mark-all-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.success;
  }

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/unread-count`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.unread_count;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.success;
  }
}

export default new NotificationService();
```

## 🔧 9. Migration

### Migration pour créer la table

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['order_new', 'order_updated', 'system', 'success', 'warning', 'error']);
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'is_read']);
            $table->index('created_at');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
```

## 📋 10. Commandes Artisan

### Commande pour nettoyer les notifications expirées

```php
<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class CleanExpiredNotifications extends Command
{
    protected $signature = 'notifications:clean';
    protected $description = 'Supprimer les notifications expirées';

    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $deleted = $this->notificationService->cleanExpired();
        
        $this->info("$deleted notification(s) expirée(s) supprimée(s).");
        
        return 0;
    }
}
```

## 🔄 11. Intégration Frontend

Une fois le backend implémenté, vous devrez modifier le frontend pour :

1. **Charger les notifications** depuis l'API au lieu du state local
2. **Synchroniser** avec le backend lors des actions (marquer comme lu, etc.)
3. **Actualiser** périodiquement ou utiliser WebSocket pour les mises à jour temps réel

## 📝 12. Points Clés

- ✅ **Persistance** : Les notifications survivent aux actualisations
- ✅ **Scalabilité** : Système gérable pour plusieurs utilisateurs
- ✅ **Performance** : Index optimisés pour les requêtes fréquentes
- ✅ **Flexibilité** : Métadonnées JSON pour données personnalisées
- ✅ **Maintenance** : Système d'expiration automatique
- ✅ **Temps réel** : Support WebSocket/Broadcasting optionnel

Ce système backend robuste remplacera complètement le système frontend actuel ! 