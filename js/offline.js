// Script para manejar la página offline
document.addEventListener('DOMContentLoaded', () => {
  updateConnectionStatus();
  
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
});

function updateConnectionStatus() {
  const statusElement = document.getElementById('connection-status');
  
  if (navigator.onLine) {
    if (statusElement) {
      statusElement.classList.remove('offline');
      statusElement.classList.add('online');
      statusElement.textContent = '🟢 En línea';
    }
    document.body.classList.remove('offline-mode');
  } else {
    if (statusElement) {
      statusElement.classList.remove('online');
      statusElement.classList.add('offline');
      statusElement.textContent = '🔴 Sin conexión (Offline)';
    }
    document.body.classList.add('offline-mode');
  }
}

// Almacenar datos localmente mientras está offline
function saveOfflineData(key, value) {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data: value,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.log('Error al guardar datos offline:', error);
  }
}

// Recuperar datos offline
function getOfflineData(key) {
  try {
    const item = localStorage.getItem(`offline_${key}`);
    return item ? JSON.parse(item).data : null;
  } catch (error) {
    console.log('Error al recuperar datos offline:', error);
    return null;
  }
}

// Limpiar datos offline sincronizados
function clearOfflineData(key) {
  localStorage.removeItem(`offline_${key}`);
}

// Sincronizar datos pendientes
async function syncOfflineData() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('offline_'));
  
  for (const key of keys) {
    try {
      const data = getOfflineData(key.replace('offline_', ''));
      // Aquí iría la lógica para enviar datos al servidor
      console.log('Sincronizando:', key, data);
      clearOfflineData(key.replace('offline_', ''));
    } catch (error) {
      console.log('Error sincronizando:', key, error);
    }
  }
}
