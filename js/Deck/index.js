class Deck {
	constructor() {
		this.quantity = 100;
		// this.apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
		this.apiUrl =
			'https://db.ygoprodeck.com/api/v7/cardinfo.php?type=normal%20monster&level=4';
		this.cards = [];
		this.decks = {
			yugi: [],
			player: [],
		};
		this.hasDrawnCard = {
			yugi: false,
			player: false,
		};

		this.hasPlacedCard = {
			yugi: true,
			player: true,
		};

		this.clickDataCard = {};
		this.currentPlayer = 1;
		this.currentPhase = 'draw';
		this.turnCount = 1;

		this.drawButton = document.getElementById('drawButton');
		this.mainPhaseButton = document.getElementById('mainPhaseButton');
		this.endPhaseButton = document.getElementById('endPhaseButton');
		this.battlePhaseButton = document.getElementById('battlePhaseButton');

		this.drawClickEventAdded = false;

		this.addEndPhaseClickHandler();
		this.addAtkPhaseClickHandler();
		this.addDragAndDropHandlers();
	}

	getRandomCards = async () => {
		try {
			const response = await fetch(this.apiUrl);
			const data = await response.json();
			const cards = data.data;
			this.cards = cards.map((card) => ({
				id: card.id.toString(),
				name: card.name,
				type: card.type,
				desc: card.desc,
				attack: card.atk,
				defense: card.def,
				imageUrl: card.card_images[0].image_url,
			}));
		} catch (error) {
			console.error('Error al obtener cartas:', error);
		}
	};

	addEndPhaseClickHandler = () => {
		document
			.getElementById('endPhaseButton')
			.addEventListener('click', () => {
				this.endPhase();
			});
	};

	addAtkPhaseClickHandler = () => {
		this.battlePhaseButton.addEventListener('click', () => {
			this.atkPhase();
		});
	};

	// DRAG AND DROP

	dragStart = (event) => {
		if (this.currentPhase !== 'main') {
			event.preventDefault();
			alert('Solo se permite arrastrar y soltar en la Main Phase.');
			return;
		}

		const draggedElement = event.target;

		const imageData = {
			src: draggedElement.src,
			tipo: draggedElement.dataset.tipo,
			ataque: draggedElement.dataset.ataque,
			defensa: draggedElement.dataset.defensa,
			id: draggedElement.dataset.id,
		};

		const jsonData = JSON.stringify(imageData);

		event.dataTransfer.setData('text/plain', jsonData);
	};

	allowDrop = (event) => {
		event.preventDefault();

		if (this.currentPhase !== 'main') {
			alert('No puedes colocar cartas fuera de la Main Phase.');
			return false;
		}

		return true;
	};

	drop = (event, dropArea) => {
		event.preventDefault();

		let player = this.currentPlayer === 1 ? 'player' : 'yugi';

		if (!this.hasPlacedCard[player]) {
			console.log('estoy aqui');
			alert(`Ya has colocado una carta en este turno.`);
			return;
		}

		if (dropArea.querySelector('img')) {
			alert('Ya hay una carta en esta área. Elige otro lugar.');
			return;
		}

		if (dropArea.dataset.status !== 'vacio-monstruo') {
			alert('Solo puedes colocar cartas de monstruo en esta área.');
			return;
		}

		const jsonData = event.dataTransfer.getData('text/plain');
		const imageData = JSON.parse(jsonData);

		if (imageData.tipo !== 'Normal Monster') {
			alert('Solo puedes colocar cartas de monstruo en esta área.');
			return;
		}

		const canvas = event.target;
		canvas.classList.add('oculto');

		// Crear un nuevo elemento de imagen y mostrar la imagen en el área de caída
		const imgElement = document.createElement('img');
		imgElement.src = imageData.src;
		imgElement.draggable = false;
		imgElement.dataset.tipo = imageData.tipo;
		imgElement.dataset.ataque = imageData.ataque;
		imgElement.dataset.defensa = imageData.defensa;
		imgElement.dataset.id = imageData.id;

		// Preguntar al usuario si quiere colocar la carta en posición de ataque o defensa
		const isAttackPosition = window.confirm(
			'¿Deseas colocar la carta en posición de ataque?'
		);

		if (!isAttackPosition) {
			// Si no es posición de ataque, cambiar el estilo y agregar el atributo de defensa
			imgElement.style.transform = 'rotate(90deg)';
			imgElement.dataset.position = 'defensa';
		} else {
			imgElement.dataset.position = 'ataque';
		}

		// Agregar el evento onclick a la imagen
		// imgElement.addEventListener('click', () => {
		//     // Lógica al hacer clic en la imagen, por ejemplo, mostrar información
		//     console.log('Clic en la imagen:', imageData);
		// });

		// Agregar la imagen al área de caída
		dropArea.appendChild(imgElement);


		// reset de la mano
		const hand = document.getElementById('cartasManoPlayer');

		const handCard = hand.querySelector(`[data-id="${imageData.id}"]`);

		if (handCard) {
			handCard.src = 'img/mazo.jpg';
			handCard.dataset.status = 'vacio';
			handCard.dataset.tipo = '';
			handCard.dataset.ataque = '';
			handCard.dataset.defensa = '';
			handCard.dataset.img = '';
			handCard.draggable = true;

			const divContainer = handCard.closest('.fila');

			divContainer.classList.add('oculto');
			divContainer.classList.remove('mostrar');

			this.hasPlacedCard[player] = false;
		}
	};

	addDragAndDropHandlers = () => {
		const draggableElements = document.querySelectorAll(
			'.cartasacada[draggable="true"]'
		);

		draggableElements.forEach((element) => {
			element.addEventListener('dragstart', this.dragStart);
		});

		// acomodar esto
		const dropAreas = document.querySelectorAll(
			'.fila[data-status="vacio-monstruo"]'
		);

		dropAreas.forEach((area) => {
			area.addEventListener('dragover', this.allowDrop);
			area.addEventListener('drop', (event) => this.drop(event, area));
		});
	};

	// FIN DRAG AND DROP

	assembleDecks = () => {
		const size = this.cards.length;
		const validatorDeck = new Set();
		const deck1 = [];
		const deck2 = [];
		let index1 = 0;
		let index2 = 0;

		while (validatorDeck.size < this.quantity) {
			const randomCard = this.cards[Math.floor(Math.random() * size)];

			if (validatorDeck.has(randomCard)) continue;

			validatorDeck.add(randomCard);

			validatorDeck.size <= this.quantity / 2
				? (deck1[index1++] = randomCard)
				: (deck2[index2++] = randomCard);
		}

		this.decks.yugi = deck1;
		this.decks.player = deck2;
	};

	dealCards = (positions, player) => {
		let playerCards =
			player === 'yugi' ? this.decks.yugi : this.decks.player;

		for (let i = 0; i < positions.length; i++) {
			let position = positions[i];
			let itemCard = document.getElementById(position);
			let card = playerCards[i];

			itemCard.src = player === 'yugi' ? './img/mazo.jpg' : card.imageUrl;
			itemCard.dataset.img = card.imageUrl;
			itemCard.dataset.tipo = card.type;
			itemCard.dataset.ataque = card.attack;
			itemCard.dataset.defensa = card.defense;

			if (player === 'player') {
				itemCard.dataset.id = position;
				// Agrega el manejador de clic aquí
				itemCard.addEventListener('click', () => {
					this.getDataCard(itemCard);
				});
			}
		}

		this.decks[player] = this.decks[player].filter(
			(cartaIndex, index) =>
				!positions.includes(`c${player.charAt(0)}${index + 1}`)
		);
	};

	getDataCard = (carObj) => {
		if (carObj.dataset.status == 'vacio') {
			this.clickDataCard = carObj;
		} else {
			carObj.dataset.status == 'vacio';
			this.clickDataCard = '';
		}
	};

	drawPhaseComputer = (player) => {
		const card = this.decks[player].shift();

		// DE LAS CARTAS QUE TIENE EN LA MANO, VER SI TIENE UN ESPACIO Y COLOCAR DICHA CARTA EN SU MANO
		const hand = document.getElementById(
			`cartasMano${player.charAt(0).toUpperCase()}${player.slice(1)}`
		);

		// Verificar si hay un espacio vacío en la mano
		const emptyHandSlot = hand.querySelector(`[data-status="vacio"]`);

		const divContainer = emptyHandSlot
			? emptyHandSlot.closest('.fila')
			: null;

		if (divContainer) {
			divContainer.classList.add('mostrar');
			divContainer.classList.remove('oculto');
		}

		if (emptyHandSlot) {
			// Colocar la carta en la mano
			emptyHandSlot.src = '/img/mazo.jpg';
			emptyHandSlot.dataset.img = card.imageUrl;
			emptyHandSlot.dataset.tipo = card.type;
			emptyHandSlot.dataset.ataque = card.attack;
			emptyHandSlot.dataset.defensa = card.defense;
			emptyHandSlot.dataset.status = 'lleno';
			emptyHandSlot.dataset.id = emptyHandSlot.id;
		} else {
			alert(`¡El jugador ${player} ya tiene 7 cartas en la mano!`);
		}
	};

	mainPhaseComputer = (player) => {
		// Obtener las cartas disponibles en la mano
		const availableHandCards = document.querySelectorAll(
			`#cartasMano${player.charAt(0).toUpperCase()}${player.slice(
				1
			)} [data-status="lleno"]`
		);
		// Verificar si hay cartas disponibles en la mano
		if (availableHandCards.length === 0) {
			alert(
				`¡El jugador ${player} no tiene cartas disponibles en la mano!`
			);
			return;
		}
		const randomHandCardIndex = Math.floor(
			Math.random() * availableHandCards.length
		);
		const randomHandCard = availableHandCards[randomHandCardIndex];
		// Obtener el área de monstruos en el campo
		const monsterField = document.getElementById('campoAtaqueYugi');
		// Obtener el área de monstruos disponible (donde no hay carta)
		const availableMonsterArea = monsterField.querySelector(
			`.fila[data-status="vacio-monstruo-yugi"]`
		);
		// Modificar esto, si no hay monstruo, atacar en vez de terminar
		if (!availableMonsterArea) {
			alert(`No hay áreas de monstruo disponibles para jugar la carta.`);
			return;
		}
		// Verificar si hay un área de monstruo disponible
		if (availableMonsterArea) {
			// Obtener el elemento canvas dentro de availableMonsterArea
			const canvasElement = availableMonsterArea.querySelector('canvas');
			// Agregar la clase 'oculto' al elemento canvas
			if (canvasElement) {
				canvasElement.classList.add('oculto');
				availableMonsterArea.dataset.status = 'lleno-monstruo-yugi';
			}
		}
		const imageData = {
			src: randomHandCard.dataset.img,
			tipo: randomHandCard.dataset.tipo,
			ataque: randomHandCard.dataset.ataque,
			defensa: randomHandCard.dataset.defensa,
			id: randomHandCard.dataset.id,
		};
		console.log(imageData);
		const imgElement = document.createElement('img');
		imgElement.src = imageData.src;
		imgElement.draggable = false;
		imgElement.dataset.tipo = imageData.tipo;
		imgElement.dataset.ataque = imageData.ataque;
		imgElement.dataset.defensa = imageData.defensa;
		imgElement.dataset.id = imageData.id;
		const isAttackPosition = Math.random() < 0.5;
		if (!isAttackPosition) {
			// Si no es posición de ataque, cambiar el estilo y agregar el atributo de defensa
			imgElement.style.transform = 'rotate(90deg)';
			imgElement.dataset.position = 'defensa';
		} else {
			imgElement.dataset.position = 'ataque';
		}
		// Agregar la imagen al área de monstruos
		availableMonsterArea.appendChild(imgElement);
		// Limpiar la carta de la mano
		randomHandCard.src = 'img/mazo.jpg';
		randomHandCard.dataset.status = 'vacio';
		randomHandCard.dataset.tipo = '';
		randomHandCard.dataset.ataque = '';
		randomHandCard.dataset.defensa = '';
		randomHandCard.dataset.img = '';
		randomHandCard.draggable = false;
		const divContainer2 = randomHandCard.closest('.fila');
		divContainer2.classList.add('oculto');
		divContainer2.classList.remove('mostrar');
		this.hasPlacedCard[player] = false;
		this.currentPhase = 'draw';
		console.log(`Yugi jugó la carta aleatoria desde la mano:`, imageData);
	};

	playComputer = () => {
		let player = 'yugi'; // Yugi es la computadora en este caso

		// Colocar carta en mano
		this.drawPhaseComputer(player);
		this.mainPhaseComputer(player);

		this.hasDrawnCard = {
			player: false,
			yugi: false,
		};
	};

	drawCard = (player) => {
		if (this.hasDrawnCard[player]) {
			alert(`El jugador ${player} ya ha robado una carta en este turno.`);
			return;
		}

		const card = this.decks[player].shift();

		const hand = document.getElementById(
			`cartasMano${player.charAt(0).toUpperCase()}${player.slice(1)}`
		);

		const emptyHandSlot = hand.querySelector(`[data-status="vacio"]`);

		const divContainer = emptyHandSlot
			? emptyHandSlot.closest('.fila')
			: null;

		if (divContainer) {
			divContainer.classList.add('mostrar');
			divContainer.classList.remove('oculto');
		}

		if (emptyHandSlot) {
			emptyHandSlot.src = card.imageUrl;
			emptyHandSlot.dataset.img = card.imageUrl;
			emptyHandSlot.dataset.tipo = card.type;
			emptyHandSlot.dataset.ataque = card.attack;
			emptyHandSlot.dataset.defensa = card.defense;
			emptyHandSlot.dataset.status = emptyHandSlot.id;
			emptyHandSlot.dataset.id = 'lleno';
		} else {
			alert(
				`¡El jugador ${player} ya tiene 7 cartas en la mano! Entrando a la Main Phase.`
			);
		}

		this.hasDrawnCard[player] = true;

		console.log(`Carta robada por ${player}:`, card);
	};

	drawPhase = (player) => {
		this.mainPhaseButton.disabled = true;
		this.battlePhaseButton.disabled = true;
		this.endPhaseButton.disabled = true;

		this.drawButton.style.backgroundColor = 'green';
		this.mainPhaseButton.style.backgroundColor = 'gray';
		this.battlePhaseButton.style.backgroundColor = 'gray';
		this.endPhaseButton.style.backgroundColor = 'gray';

		const deckElement = document.getElementById(
			`mazo${player.charAt(0).toUpperCase()}${player.slice(1)}`
		);

		if (deckElement && this.currentPlayer === 1 && player === 'player') {
			if (!this.drawClickEventAdded) {
				// Añade el evento de clic
				this.drawClickEventAdded = true;
				deckElement.addEventListener('click', this.drawCardHandler);
			}
		}

		if (this.currentPlayer === 2 && player === 'yugi') {
			this.playComputer();
			this.endPhase();
		}
	};

	// Handler para el evento de clic en el mazo
	drawCardHandler = () => {
		if (
			this.currentPlayer === 1 &&
			this.currentPhase === 'draw' &&
			!this.hasDrawnCard.player
		) {
			this.currentPhase === 'draw'
			this.hasDrawnCard = {
				...this.hasDrawnCard,
				player: false,
			};

			// Devuelve temprano si ya tiene 7 cartas
			if (this.checkHandFull('player')) {
				alert('Ya tienes 7 cartas, cambiando de fase.');
				this.currentPhase = 'main';
				this.mainPhase('player');
				return;
			}


			this.drawCard('player');
			this.currentPhase = 'main';
			this.mainPhase('player');
			// Desactiva el evento de clic después de usarlo
			this.drawClickEventAdded = false;
		}
	};

	checkHandFull = (player) => {
		const hand = document.getElementById(
			`cartasMano${player.charAt(0).toUpperCase()}${player.slice(1)}`
		);

		const fullSlots = hand.querySelectorAll('[data-status="lleno"]');
		if (fullSlots.length === 7) {
			alert(
				`¡El jugador ${player} ya tiene 7 cartas en la mano! Entrando a la Main Phase.`
			);
			return true;
		}
		return false;
	};

	atkPhase = () => {
		if (this.turnCount === 1 && this.currentPlayer === 1) {
			alert('No puedes atacar en el primer turno.');
			return;
		}

		this.mainPhaseButton.disabled = true;
		this.mainPhaseButton.style.backgroundColor = 'gray';
		this.battlePhaseButton.style.backgroundColor = 'green';

		alert(`Atk Phase`);
	};

	mainPhase = (player) => {
		this.mainPhaseButton.disabled = false;
		this.battlePhaseButton.disabled = false;
		this.endPhaseButton.disabled = false;
		this.drawButton.disabled = true;

		this.drawButton.style.backgroundColor = 'gray';
		this.mainPhaseButton.style.backgroundColor = 'green';
		this.battlePhaseButton.style.backgroundColor = 'blue';
		this.endPhaseButton.style.backgroundColor = 'blue';

		alert(`Jugador ${player} en la Main Phase.`);

		this.hasPlacedCard[player] = true;
	};

	changeTurn = () => {
		this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
		this.turnCount++;
		alert(
			`Es turno del jugador ${this.currentPlayer} - Turno ${this.turnCount}`
		);

		const self = this;

		if (this.currentPlayer === 1) {
			this.drawPhase('player');
		}

		// Si es el turno de Yugi, realiza automáticamente algunas acciones después de un retraso
		if (this.currentPlayer === 2) {
			this.mainPhaseButton.disabled = true;
			this.battlePhaseButton.disabled = true;
			this.endPhaseButton.disabled = true;
			this.drawButton.disabled = true;

			this.drawButton.style.backgroundColor = 'gray';
			this.mainPhaseButton.style.backgroundColor = 'gray';
			this.battlePhaseButton.style.backgroundColor = 'gray';
			this.endPhaseButton.style.backgroundColor = 'gray';

			this.drawPhase('yugi');

			setTimeout(function () {
				// Ahora puedes acceder a self para referirte al contexto de la clase
				this.mainPhaseButton.disabled = true;
				this.battlePhaseButton.disabled = true;
				this.endPhaseButton.disabled = true;
				this.drawButton.disabled = false;

				this.drawButton.style.backgroundColor = 'green';
				this.mainPhaseButton.style.backgroundColor = 'gray';
				this.battlePhaseButton.style.backgroundColor = 'gray';
				this.endPhaseButton.style.backgroundColor = 'gray';

				// self.endPhase();
			}, 2000); // Simula un retraso de 2 segundos antes de que Yugi finalice su turno
		}

		// Limpiar turno de jugadores
		this.hasDrawnCard = {
			yugi: false,
			player: false,
		};
	};

	endPhase = () => {
		this.currentPhase = 'draw';
		this.changeTurn();
	};

	showDecks = () => {
		// console.log('Mazo de Yugi:', this.decks.yugi);
		// console.log('Mazo de Player:', this.decks.player);
	};
}

export default Deck;
