  //asignar un nombre y versión al cache
const CACHE_NAME = 'v1_pwa_app_cache';
const urlsToCache = [
  '/Core/',
  '/Core/index.html',
  '/Core/css/style.css',
  '/Core/js/script.js',
  '/Core/img/mainlogo.png',
  '/Core/img/favicon.png'
];


  //durante la fase de instalación, generalmente se almacena en caché los activos estáticos
  self.addEventListener('install', e => {
    e.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          return cache.addAll(urlsToCache)
            .then(() => self.skipWaiting())
        })
        .catch(err => console.log('Falló registro de cache', err))
    )
  })

  //una vez que se instala el SW, se activa y busca los recursos para hacer que funcione sin conexión
  self.addEventListener('activate', e => {
    const cacheWhitelist = [CACHE_NAME]

    e.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              //Eliminamos lo que ya no se necesita en cache
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName)
              }
            })
          )
        })
        // Le indica al SW activar el cache actual
        .then(() => self.clients.claim())
    )
  })

    self.addEventListener('fetch', event => {

      const offLineResp = new Response(` 
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Mi PWA</title>
    </head>
    <body style="background-color:black; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh;">

        <img src="img/ct.png" alt="Imagen Offline" style="margin-bottom:20px;">

        <h1 style="color:white; text-align:center;">
            Se necesita conexión para funcionar
        </h1>

    </body>
    </html>  
      `, {
      headers: {
          'Content-Type': 'text/html'
      }
  });

      const resp = fetch(event.request)
                  .catch(() => offLineResp);

      event.respondWith(resp);
  });

