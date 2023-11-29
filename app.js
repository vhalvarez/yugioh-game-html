if ("serviceWorker" in navigator) {
    /* `navigator.serviceWorker` es una propiedad del objeto `navigator` en JavaScript. Proporciona acceso
    a la API Service Worker, que permite que las páginas web ejecuten scripts en segundo plano como un
    hilo separado. En este fragmento de código, `navigator.serviceWorker.register('./sw.js')` se
    utiliza para registrar un script de trabajador de servicio ubicado en `./sw.js` para la página web
    actual. */
    navigator.serviceWorker
        /* Este código registra un trabajador de servicio para la página web actual. */
        .register("./service-worker.js")
        .then((reg) => console.log("Registro de SW Exitoso :D", reg))
        .catch((err) =>
            console.warn("Error al tratar de registrar el sw :/", err)
        );
}
