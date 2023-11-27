import BuildBoardWithCanvas from './Board/index.js';
import YugiohGame from './Deck/index.js';

document.addEventListener('DOMContentLoaded', function () {
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
	tableroMagicasPlayer.initializeBoard();

	const initializeDeck = new YugiohGame();

	initializeDeck.getRandomCards().then(() => {
		initializeDeck.assembleDecks();
		

		initializeDeck.dealCards(['cy1', 'cy2', 'cy3', 'cy4', 'cy5'], 'yugi');

		initializeDeck.dealCards(['cp1', 'cp2', 'cp3', 'cp4', 'cp5'], 'player');
	});

	initializeDeck.drawPhase('player');
});
