const CACHE_NAME = 'v1_cache_yugioh',
	urlsToCache = [
		'./',
		'./css/styles.css',
		'./app.js',
		'./img/logo/Yu-Gi-Oh!.png',
	];

/* El código `self.addEventListener('install', e => {...})` está registrando un detector de eventos
para el evento 'install'. Cuando se produzca el evento 'instalación', se ejecutará el código dentro
del detector de eventos. Este evento normalmente se usa para realizar tareas como almacenar en caché
activos estáticos o configurar el trabajador del servicio por primera vez. */
self.addEventListener('install', (e) => {
	// console.log('Estoy en el self Install :D');

	e.waitUntil(
		/* El código `caches.open(CACHE_NAME).then((cache) => { return cache.addAll(urlsToCache).then(() =>
        self.skipWaiting()); }).catch((err) => consola .log('Fallo registro de cache', err))` es
        responsable de abrir un caché con el `CACHE_NAME` especificado, agregar `urlsToCache` al caché y
        luego omitir el estado de espera del trabajador del servicio. */
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				return cache.addAll(urlsToCache).then(() => self.skipWaiting());
			})
			.catch((err) => console.log('Fallo registro de cache', err))
	);
});

/* El bloque de código `self.addEventListener('activate', e => {... })` es un detector de eventos que
escucha el evento 'activate'. Cuando ocurre el evento 'activar', se ejecutará el código dentro del
detector de eventos. Este evento generalmente se usa para realizar tareas de limpieza o actualizar
el trabajador del servicio cuando se activa una nueva versión. */
self.addEventListener('activate', (e) => {
	// console.log('Estoy en el self Active :V');

	const cacheWhitelist = [CACHE_NAME];

	e.waitUntil(
		caches
			.keys()
			.then((cachesNames) => {
				cachesNames.map((cacheName) => {
					/* El código `if (cacheWhitelist.indexOf(cacheName) === -1) {
                devolver cachés.delete(cacheName);
                }` está verificando si `cacheName` no está presente en la matriz `cacheWhitelist`. Si no está
                presente, significa que el caché no forma parte de la versión de caché deseada y debe
                eliminarse. Luego se llama al método `caches.delete(cacheName)` para eliminar el caché. Esto se
                hace para garantizar que solo se conserven los cachés especificados en la matriz
                `cacheWhitelist` y que cualquier otro caché se elimine durante el proceso de activación. */
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				});
			})
			// Indica al SW Activar el cache actual
			.then(() => self.clients.claim())
	);
});


/* El código `self.addEventListener('fetch', (e) => {...})` está registrando un detector de eventos
para el evento 'fetch'. Cuando ocurre un evento de recuperación, se ejecutará el código dentro del
detector de eventos. */
self.addEventListener('fetch', (e) => {
	// console.log('Estoy en el self Fetch :P');

	e.respondWith(
		caches.match(e.request).then((res) => {
			if (res) {
				// recupera el cache
				return res;
			}
			// recuperar la peticion  a la url
			return fetch(e.request);
		})
	);
});
