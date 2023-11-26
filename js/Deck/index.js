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

		this.selectedMonstersCount = 0;
		this.selectedPlayerMonster = null;
		this.selectedRivalMonster = null;
		this.monstersAttackedStatus = {};

		this.damage = 0;

		this.lpYugi = 8000;
		this.lpPlayer = 8000;

		this.addEndPhaseClickHandler();
		this.addAtkPhaseClickHandler();
		this.addDragAndDropHandlers();
		this.updateProgressBars();
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
		this.endPhaseButton.addEventListener('click', () => {
			this.endPhase();
		});
	};

	addAtkPhaseClickHandler = () => {
		this.battlePhaseButton.addEventListener('click', () => {
			this.atkPhase();
		});
	};

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
			alert(`Ya has colocado una carta en este turno.`);
			return;
		}

		if (dropArea.querySelector('img')) {
			alert('Ya hay una carta en esta área. Elige otro lugar.');
			return;
		}

		const jsonData = event.dataTransfer.getData('text/plain');
		const imageData = JSON.parse(jsonData);

		if (imageData.tipo !== 'Normal Monster') {
			alert('Solo puedes colocar cartas de monstruo en esta área.');
			return;
		}

		const draggedElement = document.querySelector(
			'.cartasacada[draggable="true"]:hover'
		);
		const nameAttribute = draggedElement.getAttribute('data-name');
		const idCard = draggedElement.getAttribute('data-id_carta');
		imageData.name = nameAttribute;
		imageData.id_carta = idCard;

		const canvas = event.target;
		canvas.classList.add('oculto');

		// Crear un nuevo elemento de imagen y mostrar la imagen en el área de caída
		const imgElement = document.createElement('img');
		imgElement.src = imageData.src;
		imgElement.dataset.name = imageData.name;
		imgElement.draggable = false;
		imgElement.dataset.tipo = imageData.tipo;
		imgElement.dataset.id = imageData.id_carta;
		imgElement.dataset.ataque = imageData.ataque;
		imgElement.dataset.defensa = imageData.defensa;

		// Preguntar al usuario si quiere colocar la carta en posición de ataque o defensa
		const isAttackPosition = window.confirm(
			'¿Deseas colocar la carta en posición de ataque?'
		);

		let ataque = null;
		let defensa = null;

		let ataqueElement = document.getElementById(
			`ataque-campo-${imageData.id_carta}`
		);

		let defensaElement = document.getElementById(
			`defense-campo-${imageData.id_carta}`
		);

		// Elimina los elementos p existentes si hay alguno
		if (ataqueElement) {
			ataqueElement.remove();
		}

		if (defensaElement) {
			defensaElement.remove();
		}

		if (!isAttackPosition) {
			// Si no es posición de ataque, cambiar el estilo y agregar el atributo de defensa
			imgElement.style.transform = 'rotate(90deg)';
			imgElement.dataset.position = 'defensa';

			defensa = document.createElement('p');
			defensa.setAttribute('id', `defense-campo-${imageData.id_carta}`);
			defensa.textContent = `${imageData.defensa}`;
			defensa.style.color = 'red';
		} else {
			imgElement.dataset.position = 'ataque';

			ataque = document.createElement('p');
			ataque.setAttribute('id', `ataque-campo-${imageData.id_carta}`);
			ataque.textContent = `${imageData.ataque}`;
			ataque.style.color = 'green';
		}

		// Agregar la imagen al área de caída
		dropArea.dataset.status = 'lleno-monstruo';
		dropArea.appendChild(imgElement);

		if (ataque) {
			dropArea.appendChild(ataque);
		}

		if (defensa) {
			dropArea.appendChild(defensa);
		}

		// reset de la mano
		const hand = document.getElementById('cartasManoPlayer');

		const handCard = hand.querySelector(`[data-id="${imageData.id}"]`);

		if (handCard) {
			handCard.src = 'img/mazo.jpg';
			handCard.dataset.status = 'vacio';
			handCard.dataset.tipo = '';
			handCard.dataset.ataque = '';
			handCard.dataset.defensa = '';
			handCard.dataset.name = '';
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

			let ataque = null;
			let defensa = null;

			let ataqueElement = document.getElementById(`ataque-${card.id}`);

			let defensaElement = document.getElementById(`defense-${card.id}`);

			if (ataqueElement) {
				ataqueElement.remove();
			}

			if (defensaElement) {
				defensaElement.remove();
			}

			if (player === 'player') {
				defensa = document.createElement('p');
				defensa.setAttribute('id', `defense-${position}`);
				defensa.textContent = `${card.defense}`;
				defensa.style.color = 'gray';

				ataque = document.createElement('p');
				ataque.setAttribute('id', `ataque-${position}`);
				ataque.textContent = `${card.attack}`;
				ataque.style.color = 'green';

				itemCard.insertAdjacentElement('afterend', defensa);
				itemCard.insertAdjacentElement('afterend', ataque);
			}

			itemCard.src = player === 'yugi' ? './img/mazo.jpg' : card.imageUrl;
			itemCard.dataset.name = card.name;
			itemCard.dataset.img = card.imageUrl;
			itemCard.dataset.tipo = card.type;
			itemCard.dataset.ataque = card.attack;
			itemCard.dataset.defensa = card.defense;
			itemCard.dataset.id_carta = card.id;

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
			emptyHandSlot.dataset.name = card.name;
			emptyHandSlot.dataset.img = card.imageUrl;
			emptyHandSlot.dataset.tipo = card.type;
			emptyHandSlot.dataset.ataque = card.attack;
			emptyHandSlot.dataset.defensa = card.defense;
			emptyHandSlot.dataset.id_carta = card.id;
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
			name: randomHandCard.dataset.name,
			tipo: randomHandCard.dataset.tipo,
			ataque: randomHandCard.dataset.ataque,
			defensa: randomHandCard.dataset.defensa,
			id: randomHandCard.dataset.id_carta,
		};

		const imgElement = document.createElement('img');
		imgElement.src = imageData.src;
		imgElement.dataset.name = imageData.name;
		imgElement.dataset.tipo = imageData.tipo;
		imgElement.dataset.ataque = imageData.ataque;
		imgElement.dataset.defensa = imageData.defensa;
		imgElement.dataset.id = imageData.id;
		imgElement.draggable = false;

		let ataqueElement = document.getElementById(`ataque-${imageData.id}`);
		let defensaElement = document.getElementById(`defense-${imageData.id}`);

		if (ataqueElement) {
			ataqueElement.remove();
		}

		if (defensaElement) {
			defensaElement.remove();
		}

		let ataque = null;
		let defensa = null;

		const isAttackPosition = Math.random() < 0.5;

		if (!isAttackPosition) {
			// Si no es posición de ataque, cambiar el estilo y agregar el atributo de defensa
			imgElement.style.transform = 'rotate(90deg)';
			imgElement.dataset.position = 'defensa';

			defensa = document.createElement('p');
			defensa.setAttribute('id', `defense-${imageData.id}`);
			defensa.textContent = `${imageData.defensa}`;
			defensa.style.color = 'red';
		} else {
			imgElement.dataset.position = 'ataque';

			ataque = document.createElement('p');
			ataque.setAttribute('id', `ataque-${imageData.id}`);
			ataque.textContent = `${imageData.ataque}`;
			ataque.style.color = 'green';
		}
		// Agregar la imagen al área de monstruos
		availableMonsterArea.appendChild(imgElement);

		if (ataque) {
			availableMonsterArea.appendChild(ataque);
		}

		if (defensa) {
			availableMonsterArea.appendChild(defensa);
		}

		// Limpiar la carta de la mano
		randomHandCard.src = 'img/mazo.jpg';
		randomHandCard.dataset.status = 'vacio';
		randomHandCard.dataset.tipo = '';
		randomHandCard.dataset.ataque = '';
		randomHandCard.dataset.defensa = '';
		randomHandCard.dataset.img = '';
		randomHandCard.dataset.id_carta = '';
		randomHandCard.draggable = false;
		const divContainer2 = randomHandCard.closest('.fila');
		divContainer2.classList.add('oculto');
		divContainer2.classList.remove('mostrar');
		this.hasPlacedCard[player] = false;
		this.currentPhase = 'draw';
		// console.log(`Yugi jugó la carta aleatoria desde la mano:`, imageData);
	};

	playComputer = () => {
		let player = 'yugi'; // Yugi es la computadora en este caso

		// Colocar carta en mano
		this.drawPhaseComputer(player);
		this.updateTotalDeckCount(player);
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
			let defenseElement = document.getElementById(
				`defense-${emptyHandSlot.id}`
			);
			let attackElement = document.getElementById(
				`ataque-${emptyHandSlot.id}`
			);

			if (defenseElement) {
				defenseElement.remove();
			}

			if (attackElement) {
				attackElement.remove();
			}

			emptyHandSlot.src = card.imageUrl;
			emptyHandSlot.dataset.name = card.name;
			emptyHandSlot.dataset.img = card.imageUrl;
			emptyHandSlot.dataset.tipo = card.type;
			emptyHandSlot.dataset.ataque = card.attack;
			emptyHandSlot.dataset.defensa = card.defense;
			emptyHandSlot.dataset.id_carta = card.id;
			emptyHandSlot.dataset.status = 'lleno';
			emptyHandSlot.dataset.id = emptyHandSlot.id;

			let defensa = document.createElement('p');
			defensa.setAttribute('id', `defense-${emptyHandSlot.id}`);
			defensa.textContent = `${card.defense}`;
			defensa.style.color = 'gray';

			let ataque = document.createElement('p');
			ataque.setAttribute('id', `ataque-${emptyHandSlot.id}`);
			ataque.textContent = `${card.attack}`;
			ataque.style.color = 'green';

			emptyHandSlot.insertAdjacentElement('afterend', defensa);
			emptyHandSlot.insertAdjacentElement('afterend', ataque);
		} else {
			alert(
				`¡El jugador ${player} ya tiene 7 cartas en la mano! Se descarto la carta obtenida.`
			);
		}

		this.hasDrawnCard[player] = true;

		// console.log(`Carta robada por ${player}:`, card);
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
			this.currentPhase === 'draw';
			this.hasDrawnCard = {
				...this.hasDrawnCard,
				player: false,
			};

			// Devuelve temprano si ya tiene 7 cartas
			if (this.checkHandFull('player')) {
				this.currentPhase = 'main';
				this.updateTotalDeckCount('player');
				this.mainPhase('player');
				return;
			}

			this.drawCard('player');
			this.currentPhase = 'main';
			this.updateTotalDeckCount('player');
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
				`¡El jugador ${player} ya tiene 7 cartas en la mano! Se descarto la carta obtenida.`
			);
			return true;
		}
		return false;
	};

	atkPhase = () => {
		// if (this.turnCount === 1 && this.currentPlayer === 1) {
		// 	alert('No puedes atacar en el primer turno.');
		// 	return;
		// }

		this.currentPhase = 'battle';
		this.mainPhaseButton.disabled = true;
		this.mainPhaseButton.style.backgroundColor = 'gray';
		this.battlePhaseButton.style.backgroundColor = 'green';

		alert(`Atk Phase`);

		this.addClickEventToPlayerMonsters();
		this.addClickEventToRivalMonsters();
	};

	addClickEventToPlayerMonsters = () => {
		const playerMonsters = document.querySelectorAll(
			'[data-status="lleno-monstruo"]'
		);

		if (playerMonsters.length === 0) {
			alert('No tienes monstruos para atacar');
			return;
		}

		if (this.selectedPlayerMonster !== null) {
			alert(
				'Ya has seleccionado un monstruo, selecciona un monstruo de yugi.'
			);
			return;
		}

		playerMonsters.forEach((monster) => {
			const img = monster.querySelector('img');

			img.addEventListener('click', () => {
				const monsterId = img.dataset.id;

				if (img.dataset.position === 'defensa') {
					alert(
						'No puedes atacar con un monstruo en posición de defensa.'
					);
					return;
				}

				// Almacena la información del monstruo seleccionado en un objeto
				if (this.monstersAttackedStatus[monsterId]) {
					alert(
						'Este monstruo ya ha atacado en este turno. Selecciona otro monstruo o ataca directamente.'
					);
					return;
				}

				this.selectedPlayerMonster = {
					name: img.dataset.name,
					tipo: img.dataset.tipo,
					ataque: img.dataset.ataque,
					defensa: img.dataset.defensa,
					id: img.dataset.id,
					position: img.dataset.position,
				};

				alert(
					`Monstruo del jugador seleccionado: ${this.selectedPlayerMonster.name}`
				);

				const yugiMonsters = document.querySelectorAll(
					'[data-status="lleno-monstruo-yugi"]'
				);

				if (yugiMonsters.length === 0) {
					const confirmAttackDirectly = confirm(
						'Yugi no tiene monstruos en su campo. ¿Quieres atacar directamente sus puntos de vida?'
					);

					if (confirmAttackDirectly) {
						// Aquí puedes realizar la lógica para atacar directamente los puntos de vida de Yugi

						this.lpYugi -= this.selectedPlayerMonster.ataque;

						// Reinicia las variables de monstruos seleccionados después del ataque
						this.selectedPlayerMonster = null;
						this.selectedRivalMonster = null;
						this.selectedMonstersCount = 0;
						this.monstersAttackedStatus[monsterId] = true;
						this.updateProgressBars();

						return;
					}
				}

				this.selectedMonstersCount++;

				this.monstersAttackedStatus[monsterId] = true;

				// Verifica si ambos monstruos están seleccionados
				if (this.selectedMonstersCount === 2) {
					this.attackPhasePlayer();
				}
			});
		});
	};

	addClickEventToRivalMonsters = () => {
		const rivalMonsters = document.querySelectorAll(
			'[data-status="lleno-monstruo-yugi"]'
		);

		if (rivalMonsters.length === 0) {
			alert('Yugi no tiene monstruos en su campo.');
		}

		if (this.selectedRivalMonster !== null) {
			alert(
				'Ya has seleccionado un monstruo. No puedes seleccionar otro.'
			);
			return;
		}

		rivalMonsters.forEach((monster) => {
			const img = monster.querySelector('img');

			img.addEventListener('click', () => {
				if (this.selectedRivalMonster !== null) {
					alert(
						'Ya has seleccionado un monstruo. No puedes seleccionar otro.'
					);
					return;
				}

				// Almacena la información del monstruo seleccionado en un objeto
				this.selectedRivalMonster = {
					name: img.dataset.name,
					tipo: img.dataset.tipo,
					ataque: img.dataset.ataque,
					defensa: img.dataset.defensa,
					id: img.dataset.id,
					position: img.dataset.position,
				};

				alert(
					`Monstruo de yugi seleccionado: ${this.selectedRivalMonster.name}`
				);

				this.selectedMonstersCount++;

				// Verifica si ambos monstruos están seleccionados
				if (this.selectedMonstersCount === 2) {
					this.attackPhasePlayer();
				}
			});
		});
	};

	attackPhasePlayer = () => {
		// Verifica que se hayan seleccionado ambos monstruos
		if (!this.selectedPlayerMonster || !this.selectedRivalMonster) {
			alert('Debes seleccionar ambos monstruos antes de atacar.');
			return;
		}

		// Verifica que el monstruo del jugador esté en posición de ataque
		if (this.selectedPlayerMonster.position !== 'ataque') {
			alert(
				'El monstruo del jugador debe estar en posición de ataque para atacar.'
			);
			return;
		}

		// Verifica la posición del monstruo rival y realiza el cálculo del ataque
		const data = this.calculateAttackResult(
			this.selectedPlayerMonster,
			this.selectedRivalMonster
		);

		console.log(data);
		console.log(this.lpYugi);
		console.log(this.lpPlayer);

		// Actualiza los LP del rival según el resultado del ataque
		// if (damage.success) {
		// 	this.lpYugi -= damage.damage;
		// 	alert(
		// 		`¡Ataque exitoso! Yugi pierde ${damage.damage} LP. LP actual de Yugi: ${this.lpYugi}`
		// 	);
		// } else {
		// 	alert(`El ataque no tuvo éxito. LP actual de Yugi: ${this.lpYugi}`);
		// }

		// Reinicia las variables de monstruos seleccionados
		this.damage = 0;
		this.selectedMonstersCount = 0;
		this.selectedPlayerMonster = null;
		this.selectedRivalMonster = null;
		this.updateProgressBars();
	};

	calculateAttackResult = (attacker, defender) => {
		const attackerAttack = parseInt(attacker.ataque);
		const defenderAttack = parseInt(defender.ataque);
		const defenderDefense = parseInt(defender.defensa);

		let playerMonsterYugiDivs;

		switch (true) {
			case attackerAttack > defenderDefense &&
				defender.position === 'defensa':
				// Caso 1: El ataque de selectedPlayerMonster es mayor que la defensa de selectedRivalMonster en posición de defensa
				// Agregar lógica aquí para destruir el monstruo rival en posición de defensa (si es necesario)

				playerMonsterYugiDivs = document.querySelectorAll(
					`[data-status="lleno-monstruo-yugi"]`
				);

				for (const div of playerMonsterYugiDivs) {
					const img = div.querySelector('img');
					if (img && img.dataset.id === defender.id) {
						const canvas = div.querySelector('canvas');
						const p = div.querySelector('p');

						div.setAttribute('data-status', 'vacio-monstruo-yugi');
						img.remove();
						p.remove();
						canvas.classList.remove('oculto');

						break; // Rompe el bucle si se encuentra la coincidencia
					}
				}

				playerMonsterYugiDivs = null;

				this.damage = 0;
				this.selectedPlayerMonster = null;
				this.selectedRivalMonster = null;
				return {
					success: true,
					message: 'Se vencio al monstruo de yugi en defensa',
				};

			case attackerAttack > defenderAttack &&
				defender.position === 'ataque':
				// Caso 2: El ataque de selectedPlayerMonster es mayor que el ataque de selectedRivalMonster en posición de ataque
				this.damage = attackerAttack - defenderAttack;
				this.lpYugi -= this.damage; // Restar la diferencia al LP de Yugi
				this.damage = 0;
				this.selectedPlayerMonster = null;
				this.selectedRivalMonster = null;

				playerMonsterYugiDivs = document.querySelectorAll(
					`[data-status="lleno-monstruo-yugi"]`
				);

				for (const div of playerMonsterYugiDivs) {
					const img = div.querySelector('img');
					if (img && img.dataset.id === defender.id) {
						const canvas = div.querySelector('canvas');
						const p = div.querySelector('p');

						div.setAttribute('data-status', 'vacio-monstruo-yugi');
						img.remove();
						p.remove();
						canvas.classList.remove('oculto');

						break; // Rompe el bucle si se encuentra la coincidencia
					}
				}

				playerMonsterYugiDivs = null;

				return {
					success: true,
					message: 'Se vencio al monstruo de yugi',
				};

			case attackerAttack < defenderAttack &&
				defender.position === 'ataque':
				// Caso 3: El ataque de selectedPlayerMonster es menor que el ataque de selectedRivalMonster en posición de ataque
				this.damage = defenderAttack - attackerAttack;
				this.lpPlayer -= this.damage; // Restar la diferencia al LP de Player
				this.damage = 0;
				this.selectedPlayerMonster = null;
				this.selectedRivalMonster = null;

				console.log(attacker);
				console.log(defender);

				return {
					success: false,
					message:
						'El ataque de Player es menor que el ataque de Yugi',
				};

			case attackerAttack === defenderAttack:
				// Caso 4: El ataque de selectedPlayerMonster es igual al ataque de selectedRivalMonster
				// Agregar lógica aquí para destruir ambos monstruos (si es necesario)
				this.damage = 0;
				this.selectedPlayerMonster = null;
				this.selectedRivalMonster = null;

				console.log(attacker);
				console.log(defender);

				return {
					success: true,
					message: 'Se destruyeron ambos monstruos',
				};

			case attackerAttack === defenderDefense:
				// Caso 5: El ataque de selectedPlayerMonster es igual a la defensa de selectedRivalMonster
				// Agregar lógica aquí para manejar el caso en que no ocurre daño
				this.damage = 0;
				this.selectedPlayerMonster = null;
				this.selectedRivalMonster = null;

				console.log(attacker);
				console.log(defender);

				return { success: false };

			case attackerAttack < defenderDefense &&
				defender.position === 'defensa':
				// Caso 6: El ataque de selectedPlayerMonster es menor que la defensa de selectedRivalMonster en posición de defensa
				this.damage = defenderDefense - attackerAttack;
				this.lpPlayer -= this.damage; // Restar la diferencia al LP de Player

				this.damage = 0;
				this.selectedPlayerMonster = null;
				this.selectedRivalMonster = null;

				console.log(attacker);
				console.log(defender);

				return {
					success: false,
					message:
						'La defensa del monstruo atacado es mayor que el ataque',
				};
		}

		this.damage = 0;
		this.selectedPlayerMonster = null;
		this.selectedRivalMonster = null;

		return { success: false };
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

		this.monstersAttackedStatus = {};
		this.damage = 0;
		this.selectedMonstersCount = 0;
		this.selectedPlayerMonster = null;
		this.selectedRivalMonster = null;
		this.updateProgressBars();

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
			}, 1000); // Simula un retraso de 2 segundos antes de que Yugi finalice su turno
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

	getTotalDeckCount = (player) => {
		// Lógica para obtener el total de cartas en el mazo del jugador
		return this.decks[player].length;
	};

	// Función para actualizar el total del deck del jugador en el elemento HTML
	updateTotalDeckCount = (player) => {
		const totalDeckElement = document.getElementById(
			`totalDeck${player.charAt(0).toUpperCase()}${player.slice(1)}`
		);

		if (totalDeckElement) {
			const totalDeckCount = this.getTotalDeckCount(player);
			totalDeckElement.innerHTML = `<h5>${totalDeckCount}</h5>`;
			totalDeckElement.classList.add('text-white');
		}
	};

	updateProgressBars = () => {
		// Actualiza la barra de progreso del jugador
		const playerProgressBar = document.getElementById('playerProgressBar');
		playerProgressBar.value = this.lpPlayer;
		document.getElementById(
			'playerLpText'
		).textContent = `LP: ${this.lpPlayer}`;

		// Actualiza la barra de progreso de Yugi
		const yugiProgressBar = document.getElementById('yugiProgressBar');
		yugiProgressBar.value = this.lpYugi;
		document.getElementById(
			'yugiLpText'
		).textContent = `LP: ${this.lpYugi}`;
	};

	showDecks = () => {
		// console.log('Mazo de Yugi:', this.decks.yugi);
		// console.log('Mazo de Player:', this.decks.player);
	};
}

export default Deck;
