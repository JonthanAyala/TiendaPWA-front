/**
 * 📦 OFFLINE MANAGER
 * Maneja almacenamiento local con IndexedDB para modo offline
 */

const DB_NAME = 'TiendaPWA_DB';
const DB_VERSION = 1;

// Stores (tablas) de IndexedDB
const STORES = {
    PRODUCTS: 'products',
    STORES: 'stores',
    PENDING_ORDERS: 'pending_orders',
    PENDING_VISITS: 'pending_visits',
    CACHE_DATA: 'cache_data'
};

class OfflineManager {
    constructor() {
        this.db = null;
        this.isOnline = navigator.onLine;
        this.setupConnectionListeners();
    }

    /**
     * Inicializar IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object stores si no existen
                if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                    db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.STORES)) {
                    db.createObjectStore(STORES.STORES, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.PENDING_ORDERS)) {
                    const orderStore = db.createObjectStore(STORES.PENDING_ORDERS, { keyPath: 'tempId' });
                    orderStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!db.objectStoreNames.contains(STORES.PENDING_VISITS)) {
                    const visitStore = db.createObjectStore(STORES.PENDING_VISITS, { keyPath: 'tempId' });
                    visitStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!db.objectStoreNames.contains(STORES.CACHE_DATA)) {
                    const cacheStore = db.createObjectStore(STORES.CACHE_DATA, { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('📦 Object stores creados en IndexedDB');
            };
        });
    }

    /**
     * Configurar listeners de conexión
     */
    setupConnectionListeners() {
        window.addEventListener('online', () => {
            console.log('🟢 Conexión restaurada');
            this.isOnline = true;
            this.updateConnectionStatus(true);
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            console.log('🔴 Sin conexión a internet');
            this.isOnline = false;
            this.updateConnectionStatus(false);
        });
    }

    /**
     * Actualizar indicador visual de conexión
     */
    updateConnectionStatus(isOnline) {
        // Buscar o crear indicador
        let indicator = document.getElementById('connection-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'connection-indicator';
            indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        z-index: 10000;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
            document.body.appendChild(indicator);
        }

        if (isOnline) {
            indicator.style.background = '#10b981';
            indicator.style.color = 'white';
            indicator.innerHTML = '🟢 Conectado';
            setTimeout(() => indicator.style.opacity = '0', 3000);
        } else {
            indicator.style.background = '#ef4444';
            indicator.style.color = 'white';
            indicator.style.opacity = '1';
            indicator.innerHTML = '🔴 Sin conexión (Modo Offline)';
        }

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('connectionchange', { detail: { isOnline } }));
    }

    // ═══════════════════════════════════════════════════
    // 📦 PRODUCTOS
    // ═══════════════════════════════════════════════════

    async saveProducts(products) {
        const tx = this.db.transaction([STORES.PRODUCTS], 'readwrite');
        const store = tx.objectStore(STORES.PRODUCTS);

        for (const product of products) {
            await store.put(product);
        }

        console.log(`✅ ${products.length} productos guardados offline`);
    }

    async getProducts() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.PRODUCTS], 'readonly');
            const store = tx.objectStore(STORES.PRODUCTS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ═══════════════════════════════════════════════════
    // 🏢 TIENDAS
    // ═══════════════════════════════════════════════════

    async saveStores(stores) {
        const tx = this.db.transaction([STORES.STORES], 'readwrite');
        const store = tx.objectStore(STORES.STORES);

        for (const storeData of stores) {
            await store.put(storeData);
        }

        console.log(`✅ ${stores.length} tiendas guardadas offline`);
    }

    async getStores() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.STORES], 'readonly');
            const store = tx.objectStore(STORES.STORES);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ═══════════════════════════════════════════════════
    // 🛒 PEDIDOS PENDIENTES (Offline)
    // ═══════════════════════════════════════════════════

    async savePendingOrder(orderData) {
        const pendingOrder = {
            tempId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...orderData,
            offline: true,
            timestamp: Date.now()
        };

        const tx = this.db.transaction([STORES.PENDING_ORDERS], 'readwrite');
        const store = tx.objectStore(STORES.PENDING_ORDERS);
        await store.put(pendingOrder);

        console.log('💾 Pedido guardado offline:', pendingOrder.tempId);
        return pendingOrder;
    }

    async getPendingOrders() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.PENDING_ORDERS], 'readonly');
            const store = tx.objectStore(STORES.PENDING_ORDERS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePendingOrder(tempId) {
        const tx = this.db.transaction([STORES.PENDING_ORDERS], 'readwrite');
        const store = tx.objectStore(STORES.PENDING_ORDERS);
        await store.delete(tempId);
        console.log('🗑️ Pedido sincronizado eliminado:', tempId);
    }

    // ═══════════════════════════════════════════════════
    // 📍 VISITAS PENDIENTES (Offline)
    // ═══════════════════════════════════════════════════

    async savePendingVisit(visitData) {
        const pendingVisit = {
            tempId: `offline_visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...visitData,
            offline: true,
            timestamp: Date.now()
        };

        const tx = this.db.transaction([STORES.PENDING_VISITS], 'readwrite');
        const store = tx.objectStore(STORES.PENDING_VISITS);
        await store.put(pendingVisit);

        console.log('💾 Visita guardada offline:', pendingVisit.tempId);
        return pendingVisit;
    }

    async getPendingVisits() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORES.PENDING_VISITS], 'readonly');
            const store = tx.objectStore(STORES.PENDING_VISITS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePendingVisit(tempId) {
        const tx = this.db.transaction([STORES.PENDING_VISITS], 'readwrite');
        const store = tx.objectStore(STORES.PENDING_VISITS);
        await store.delete(tempId);
        console.log('🗑️ Visita sincronizada eliminada:', tempId);
    }

    // ═══════════════════════════════════════════════════
    // 🔄 SINCRONIZACIÓN
    // ═══════════════════════════════════════════════════

    async syncPendingData() {
        if (!this.isOnline) {
            console.log('⏸️ No hay conexión, sincronización pospuesta');
            return;
        }

        console.log('🔄 Iniciando sincronización...');

        try {
            // Sincronizar pedidos pendientes
            const pendingOrders = await this.getPendingOrders();
            console.log(`📦 ${pendingOrders.length} pedidos pendientes a sincronizar`);

            for (const order of pendingOrders) {
                try {
                    // Preparar datos para el backend (eliminar campos temporales)
                    const orderToSend = {
                        clientName: order.clientName,
                        storeId: order.storeId,
                        items: order.items
                    };

                    // Enviar al backend
                    const response = await OrderAPI.create(orderToSend);
                    console.log('✅ Pedido sincronizado:', order.tempId, '→', response.id);

                    // Eliminar de pendientes
                    await this.deletePendingOrder(order.tempId);

                } catch (error) {
                    console.error('❌ Error sincronizando pedido:', order.tempId, error);
                    // No eliminamos el pedido si falla la sincronización
                }
            }

            // Sincronizar visitas pendientes
            const pendingVisits = await this.getPendingVisits();
            console.log(`📍 ${pendingVisits.length} visitas pendientes a sincronizar`);

            for (const visit of pendingVisits) {
                try {
                    await VisitAPI.registerScan(
                        visit.storeCode,
                        visit.repartidorId,
                        visit.lat,
                        visit.lng,
                        visit.hadOrder || false,
                        visit.temporary || false
                    );
                    console.log('✅ Visita sincronizada:', visit.tempId);
                    await this.deletePendingVisit(visit.tempId);

                } catch (error) {
                    console.error('❌ Error sincronizando visita:', visit.tempId, error);
                }
            }

            // Mostrar notificación de éxito
            if (pendingOrders.length > 0 || pendingVisits.length > 0) {
                this.showSyncNotification(pendingOrders.length, pendingVisits.length);
            }

        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        }
    }

    showSyncNotification(ordersCount, visitsCount) {
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      text-align: center;
      animation: fadeIn 0.3s ease;
    `;
        notification.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
      <h3 style="margin: 0 0 10px 0; color: #10b981;">Sincronización Completa</h3>
      <p style="margin: 0; color: #666;">
        ${ordersCount} pedido(s) y ${visitsCount} visita(s) sincronizados
      </p>
    `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ═══════════════════════════════════════════════════
    // 📊 ESTADÍSTICAS
    // ═══════════════════════════════════════════════════

    async getStats() {
        const products = await this.getProducts();
        const stores = await this.getStores();
        const pendingOrders = await this.getPendingOrders();
        const pendingVisits = await this.getPendingVisits();

        return {
            products: products.length,
            stores: stores.length,
            pendingOrders: pendingOrders.length,
            pendingVisits: pendingVisits.length,
            isOnline: this.isOnline
        };
    }
}

// Instancia global
const offlineManager = new OfflineManager();

// Inicializar automáticamente
offlineManager.init().then(() => {
    console.log('🚀 Offline Manager listo');
}).catch(error => {
    console.error('❌ Error inicializando Offline Manager:', error);
});

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);
