export class Preview {
	/**
	 * La función constructora inicializa una propiedad de cadena vacía llamada "img".
	 */
	constructor() {
		this.img = '';
	}

	/* El método `getDataCharacters` es una función que recupera el valor de la clave 'img' del
	sessionStorage y lo asigna a la propiedad `this.img` de la clase `Preview`. */
	getDataCharacters = () => {
		this.img = sessionStorage.getItem('img');

		/* El código selecciona un elemento HTML con el id 'hero__image-left' usando el método
		`getElementById` y lo asigna a la variable `heroImageLeft`. */
		let heroImageLeft = document.getElementById('hero__image-left');
		let nuevoFondo = `linear-gradient(90deg, rgba(2,0,36,0) 27%, rgba(0,0,0,1) 95%), url('../img/personajes/${this.img}-wallpaper.jpg')`;
		heroImageLeft.style.backgroundImage = nuevoFondo;
	};

	/**
	 * La función "updateName" recupera el nombre del usuario del almacenamiento de la sesión y actualiza
	 * el contenido de un elemento HTML con ese nombre.
	 */
	updateName = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const nombreElement = document.getElementById('nombre');

        // Verifica si el elemento y los datos del usuario existen antes de actualizar el contenido
        if (nombreElement && user && user.data && user.data.name) {
            // Actualiza el contenido del elemento con el nombre del usuario
            nombreElement.textContent = user.data.name;
        }
    }

	/**
	 * La función `redirect()` redirige al usuario a la página "battle.html" después de un retraso de 6
	 * segundos.
	 */
	redirect = () => {
		setTimeout(() => {
			location.href = 'battle.html';
		}, 6000);
	}
}
