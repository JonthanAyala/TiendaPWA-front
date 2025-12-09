/**
 * FIX para app.js - Deshabilita código antiguo de notificaciones
 * Este archivo debe cargarse DESPUÉS de app.js
 */

// Sobrescribir la función antigua de notificaciones para que no haga nada
if (typeof setupPushNotifications !== 'undefined') {
    window.setupPushNotifications = function () {
        console.log('⚠️ setupPushNotifications() está deshabilitada');
        console.log('✅ Usa firebase-notifications.js en su lugar');
    };
}

console.log('🔧 Fix de app.js cargado - Notificaciones ahora manejadas por firebase-notifications.js');
