import BuildBoardWithCanvas from './Board/index.js';
import YugiohGame from './Game/index.js';
import { Session } from './auth/session.js';

if (!Session.isUserLoggedIn()) {
    // Si no está autenticado, redirige a la página de inicio de sesión
    location.href = "../login.html";
}

document.addEventListener('DOMContentLoaded', function () {
	// Asumiendo que ya tienes la clase figure definida
	/* El código crea instancias de la clase `BuildBoardWithCanvas` e inicializa los tableros de juego
    para el juego Yu-Gi-Oh. */
    const tableroMonstruoYugi = new BuildBoardWithCanvas(
		'tableroMonstruoYugi',
		'monstruos'
	);
	tableroMonstruoYugi.initializeBoard();

	const tableroMagicasYugi = new BuildBoardWithCanvas(
		'tableroMagicasYugi',
		'magica'
	);
	tableroMagicasYugi.initializeBoard();

	const tableroMonstruoPlayer = new BuildBoardWithCanvas(
		'tableroMonstruoPlayer',
		'monstruos'
	);
	tableroMonstruoPlayer.initializeBoard();

	const tableroMagicasPlayer = new BuildBoardWithCanvas(
		'tableroMagicasPlayer',
		'magica'
	);
	
	/* La línea `tableroMagicasPlayer.initializeBoard();` está llamando al método `initializeBoard` del
    objeto `tableroMagicasPlayer`. Este método se encarga de inicializar el tablero de las cartas
    "magicas" (mágicas) del juego Yu-Gi-Oh. Establece los elementos y configuraciones necesarios para
    que el tablero se muestre e interactúe. */
    tableroMagicasPlayer.initializeBoard();

	/* La línea `const inicializeDeck = new YugiohGame();` crea una nueva instancia de la clase
    `YugiohGame` y la asigna a la variable `initializeDeck`. Esto le permite acceder y utilizar los
    métodos y propiedades definidos en la clase `YugiohGame`. */
    const initializeDeck = new YugiohGame();

	/* La función `initializeDeck.loadImage();` probablemente sea responsable de cargar las imágenes
    necesarias para el juego Yu-Gi-Oh. Podría ser buscar y precargar imágenes de cartas o cualquier
    otra imagen necesaria para el juego. */
    initializeDeck.loadImage();

	/* El código `initializeDeck.getRandomCards().then(() => {... })` utiliza una promesa para recuperar
    tarjetas aleatorias de forma asincrónica. Una vez que se resuelve la promesa, se ejecuta el código
    dentro del bloque "entonces". */
    initializeDeck.getRandomCards().then(() => {
		initializeDeck.assembleDecks();

		initializeDeck.dealCards(['cy1', 'cy2', 'cy3', 'cy4', 'cy5'], 'yugi');

		initializeDeck.dealCards(['cp1', 'cp2', 'cp3', 'cp4', 'cp5'], 'player');
	});

	/* La línea `initializeDeck.drawPhase('player');` llama al método `drawPhase` del objeto
    `initializeDeck` y pasa el argumento ``player'`. */
    initializeDeck.drawPhase('player');
});
