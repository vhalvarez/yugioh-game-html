/* La `clase BuildBoardWithCanvas` define una clase de JavaScript que se utiliza para construir un
tablero con elementos de lienzo. Tiene varios métodos que manejan la creación de elementos del
lienzo, dibujar imágenes en el lienzo e inicializar el tablero creando elementos del lienzo y
dibujando imágenes en ellos. El constructor toma dos parámetros: `containerId`, que es la
identificación del elemento contenedor donde se agregarán los elementos del lienzo, y `cardType`,
que representa el tipo de tarjeta que se mostrará en el lienzo. */
class BuildBoardWithCanvas {
	/**
	 * La función constructora inicializa un objeto con un elemento contenedor y un tipo de tarjeta.
	 * @param containerId - El parámetro containerId es la identificación del elemento HTML que
	 * contendrá las tarjetas. Se utiliza para recuperar el elemento contenedor utilizando el método
	 * document.getElementById().
	 * @param cardType - El parámetro `cardType` es una cadena que representa el tipo de tarjeta.
	 */
	constructor(containerId, cardType) {
		this.container = document.getElementById(containerId);
		this.cardType = cardType;
	}

	/**
	 * La función `drawImageOnCanvas` toma una fuente de imagen y un elemento de lienzo como
	 * parámetros, y dibuja la imagen en el lienzo usando el contexto 2D.
	 * @param imageSrc - La URL o ruta de origen de la imagen. Especifica la ubicación del archivo de
	 * imagen que desea dibujar en el lienzo.
	 * @param canvas - El parámetro lienzo es el elemento lienzo HTML en el que se dibujará la imagen.
	 */
	drawImageOnCanvas = (imageSrc, canvas) => {
		const ctx = canvas.getContext('2d');
		const img = new Image();
		img.src = imageSrc;

		img.onload = function () {
			ctx.drawImage(img, 0, 0, 70, 102.25);
		};
	};

	/**
	 * La función crea un elemento de lienzo y lo agrega a un elemento contenedor.
	 * @returns el elemento de lienzo creado.
	 */
	createCanvas = () => {
		const canvas = document.createElement('canvas');
		this.container.appendChild(canvas);
		return canvas;
	};

	/**
	 * La función devuelve la ruta de la imagen según el tipo de tarjeta.
	 * @returns una cadena que representa la ruta a un archivo de imagen. La ruta se construye
	 * utilizando el valor de la propiedad `cardType` del objeto.
	 */
	buildImagePath = () => {
		return `img/${this.cardType}.jpg`; // Ajusta la ruta según tu estructura de carpetas
	};

	/**
	 * La función inicializa una plataforma creando elementos de lienzo y dibujando imágenes en ellos.
	 */
	initializeBoard = () => {
		this.container.querySelectorAll('.fila').forEach((div) => {
			const canvas = this.createCanvas();
			const imageSrc = this.buildImagePath();
			this.drawImageOnCanvas(imageSrc, canvas);

			div.appendChild(canvas);
		});
	};
}

export default BuildBoardWithCanvas;
