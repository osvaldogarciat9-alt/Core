class PushNotificationManager {
    constructor() {
        this.suscripcion = null;
        this.btnSuscribir = document.getElementById('btn-suscribir');
        this.btnTest = document.getElementById('btn-test');
        this.btnOferta = document.getElementById('btn-oferta');
        this.status = document.getElementById('status');
        
        this.inicializar();
    }
    
    async inicializar() {
        // Verificar compatibilidad del navegador
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            this.mostrarEstado('❌ Tu navegador no soporta notificaciones push', 'error');
            this.btnSuscribir.disabled = true;
            return;
        }
        
        try {
            // Registrar Service Worker
            const registro = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado:', registro);
            
            // Esperar a que el Service Worker esté activo
            await navigator.serviceWorker.ready;
            console.log('Service Worker listo');
            
            // Verificar si ya estamos suscritos
            this.suscripcion = await registro.pushManager.getSubscription();
            
            if (this.suscripcion) {
                this.mostrarEstado('✅ Ya estás suscrito a las notificaciones', 'success');
                this.habilitarBotones();
            } else {
                this.mostrarEstado('👋 Haz clic en "Suscribirse" para recibir promociones ', 'info');
            }
            
            this.configurarEventos();
            
        } catch (error) {
            console.error('Error registrando Service Worker:', error);
            this.mostrarEstado('❌ Error al registrar Service Worker: ' + error.message, 'error');
        }
    }
    
    configurarEventos() {
        this.btnSuscribir.addEventListener('click', () => this.suscribir());
        this.btnTest.addEventListener('click', () => this.enviarNotificacion('test'));
        this.btnOferta.addEventListener('click', () => this.enviarNotificacion('oferta'));
    }
    
    async suscribir() {
        try {
            this.mostrarEstado('⏳ Solicitando permisos...', 'info');
            
            // Solicitar permiso
            const permiso = await Notification.requestPermission();
            console.log('Permiso de notificación:', permiso);
            
            if (permiso !== 'granted') {
                this.mostrarEstado('❌ Permiso denegado para notificaciones', 'error');
                return;
            }
            
            this.mostrarEstado('🔗 Suscribiendo...', 'info');
            
            // Convertir la clave pública
            const applicationServerKey = this.urlBase64ToUint8Array(
                'BOEQSjdhorIf8M0XFNlwohK3sTz6h-J2SVIptPfR7mpOlGCdXK1qF7H2aV0-5Fz4kd-v2CCkzDnQvQxQpLOaZjY'
            );
            
            // Suscribir al usuario
            const registro = await navigator.serviceWorker.ready;
            this.suscripcion = await registro.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            console.log('Suscripción creada:', this.suscripcion);
            
            // Enviar suscripción al servidor
            await this.guardarSuscripcion();
            
            this.mostrarEstado('✅ ¡Suscripción exitosa! Ahora recibirás notificaciones', 'success');
            this.habilitarBotones();
            
        } catch (error) {
            console.error('Error en suscripción:', error);
            this.mostrarEstado('❌ Error en la suscripción: ' + error.message, 'error');
        }
    }
    
    async guardarSuscripcion() {
        try {
            // Convertir la suscripción a un objeto simple
            const suscripcionData = {
                endpoint: this.suscripcion.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(this.suscripcion.getKey('p256dh')))),
                    auth: btoa(String.fromCharCode.apply(null, new Uint8Array(this.suscripcion.getKey('auth'))))
                }
            };
            
            const response = await fetch('/backend/suscribir.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    suscripcion: suscripcionData,
                    categoria: 'estudiante'
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Error desconocido');
            }
            
            console.log('Suscripción guardada en servidor:', data);
            
        } catch (error) {
            console.error('Error guardando suscripción:', error);
            throw error;
        }
    }
    
    async enviarNotificacion(tipo) {
        try {
            this.mostrarEstado('📤 Enviando notificación...', 'info');
            
            const response = await fetch('/backend/enviar-notificacion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tipo })
            });
            
            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            
            if (data.success) {
                this.mostrarEstado(
                    `✅ ${data.message} - Verifica la notificación en tu sistema`, 
                    'success'
                );
                
                // Mostrar notificación local inmediata para prueba
                if (data.enviadas === 0) {
                    this.mostrarNotificacionLocal(tipo);
                }
            } else {
                this.mostrarEstado('❌ Error enviando notificación: ' + data.message, 'error');
            }
            
        } catch (error) {
            console.error('Error enviando notificación:', error);
            this.mostrarEstado('❌ Error de conexión: ' + error.message, 'error');
        }
    }
    
    // Función de respaldo: mostrar notificación local inmediata
    mostrarNotificacionLocal(tipo) {
        if (Notification.permission === 'granted') {
            const titulos = {
                test: '✅ Oferta Especial',
                oferta: '🎉 Oferta Especial'
            };
            
            const cuerpos = {
                test: '20% de descuento en Gestion de redes sociales',
                oferta: '¡50% de descuento en Desarollo de Videojuegos.'
            };
            
            const notificacion = new Notification(titulos[tipo] || 'Notificación', {
                body: cuerpos[tipo] || 'Mensaje de notificación',
                icon: '/assets/icon-192.png',
                badge: '/assets/badge-72.png'
            });
            
            notificacion.onclick = function() {
                window.focus();
                notificacion.close();
            };
        }
    }
    
    habilitarBotones() {
        this.btnSuscribir.disabled = true;
        this.btnSuscribir.textContent = '✅ Suscrito';
        this.btnTest.disabled = false;
        this.btnOferta.disabled = false;
    }
    
    mostrarEstado(mensaje, tipo = 'info') {
        this.status.textContent = mensaje;
        this.status.className = `status ${tipo}`;
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Inicializar cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    new PushNotificationManager();
});