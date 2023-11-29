import { firebase } from "../auth/firebase.js";
import { Session } from '../auth/session.js'

class YugiohGame {
    /**
     * La función constructora inicializa varias propiedades y configura controladores de eventos para el
     * juego.
     */
    constructor() {
        this.quantity = 100;
        this.apiUrlSpell =
            "https://db.ygoprodeck.com/api/v7/cardinfo.php?type=spell%20card&race=equip&num=10&offset=0";
        this.apiUrlMonster =
            "https://db.ygoprodeck.com/api/v7/cardinfo.php?type=normal%20monster&level=4";
        this.cardsMonster = [];
        this.cardsSpell = [];
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
        this.currentPhase = "draw";
        this.turnCount = 1;

        this.drawButton = document.getElementById("drawButton");
        this.mainPhaseButton = document.getElementById("mainPhaseButton");
        this.endPhaseButton = document.getElementById("endPhaseButton");
        this.battlePhaseButton = document.getElementById("battlePhaseButton");

        this.drawClickEventAdded = false;

        this.selectedMonstersCount = 0;
        this.selectedPlayerMonster = null;
        this.selectedRivalMonster = null;
        this.monstersAttackedStatus = {};
        this.yugiMonstersInAttackPosition = [];

        this.damage = 0;

        this.lpYugi = 8000;
        this.lpPlayer = 8000;

        this.addEndPhaseClickHandler();
        this.addAtkPhaseClickHandler();
        this.addDragAndDropHandlers();
        this.updateProgressBars();
    }

    /* El código anterior define una función asincrónica llamada "getRandomCards". Esta función realiza
	dos solicitudes de API utilizando "fetch" para recuperar datos de cartas de monstruos y cartas de
	hechizos. Luego asigna los datos de respuesta para crear una serie de objetos para cada tarjeta,
	incluidas propiedades como identificación, nombre, tipo, descripción, ataque, defensa e imageUrl.
	La función maneja cualquier error que ocurra durante las solicitudes de API y los registra en la
	consola. */
    getRandomCards = async () => {
        try {
            const [monsterResponse, spellResponse] = await Promise.all([
                fetch(this.apiUrlMonster).then((response) => response.json()),
                fetch(this.apiUrlSpell).then((response) => response.json()),
            ]);

            const cardsMonster = monsterResponse.data;
            this.cardsMonster = cardsMonster.map((card) => ({
                id: card.id.toString(),
                name: card.name,
                type: card.type,
                desc: card.desc,
                attack: card.atk,
                defense: card.def,
                imageUrl: card.card_images[0].image_url,
            }));

            const cardsSpell = spellResponse.data;
            this.cardsSpell = cardsSpell.map((card) => ({
                id: card.id.toString(),
                name: card.name,
                type: card.type,
                desc: card.desc,
                attack: card.atk,
                defense: card.def,
                imageUrl: card.card_images[0].image_url,
            }));
        } catch (error) {
            console.error("Error al obtener cartas:", error);
            return;
        }
    };

    /* El código anterior define una función llamada `addEndPhaseClickHandler` que agrega un detector de
	eventos de clic a un elemento de botón con el ID `endPhaseButton`. Cuando se hace clic en el botón,
	se llama a la función `endPhase`. */
    addEndPhaseClickHandler = () => {
        this.endPhaseButton.addEventListener("click", () => {
            this.endPhase();
        });
    };

    /* El código anterior define una función llamada `addAtkPhaseClickHandler` que agrega un detector de
	eventos de clic a un elemento de botón con el ID `battlePhaseButton`. Cuando se hace clic en el
	botón, se llama a la función `atkPhase`. */
    addAtkPhaseClickHandler = () => {
        this.battlePhaseButton.addEventListener("click", () => {
            this.atkPhase();
        });
    };

    /* El código anterior define una función llamada "dragStart" en JavaScript. Esta función es un
	controlador de eventos para el evento "dragstart". */
    dragStart = (event) => {
        if (this.currentPhase !== "main") {
            event.preventDefault();
            alert("Solo se permite arrastrar y soltar en la Main Phase.");
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

        event.dataTransfer.setData("text/plain", jsonData);
    };

    /* El código anterior define una función llamada "allowDrop" en JavaScript. Esta función se utiliza
	como controlador de eventos para el evento "dragover". Previene el comportamiento predeterminado
	del evento y verifica si la fase actual no es igual a 'principal'. Si no es así, muestra un mensaje
	de alerta que dice que las cartas no se pueden colocar fuera de la Fase Principal. Si la fase
	actual es "principal", devuelve verdadero. */
    allowDrop = (event) => {
        event.preventDefault();

        if (this.currentPhase !== "main") {
            alert("No puedes colocar cartas fuera de la Main Phase.");
            return;
        }

        return true;
    };

    /* El código anterior es una función de JavaScript llamada "dropMonster" que se utiliza para manejar
	la caída de una carta de monstruo en un área específica en un juego de cartas. */
    dropMonster = (event, dropArea) => {
        event.preventDefault();

        let player = this.currentPlayer === 1 ? "player" : "yugi";

        if (!this.hasPlacedCard[player]) {
            alert(`Ya has colocado una carta en este turno.`);
            return;
        }

        if (dropArea.querySelector("img")) {
            alert("Ya hay una carta en esta área. Elige otro lugar.");
            return;
        }

        const jsonData = event.dataTransfer.getData("text/plain");
        const imageData = JSON.parse(jsonData);

        if (imageData.tipo !== "Normal Monster") {
            alert("Solo puedes colocar cartas de monstruo en esta área.");
            return;
        }

        const draggedElement = document.querySelector(
            '.cartasacada[draggable="true"]:hover'
        );
        const nameAttribute = draggedElement.getAttribute("data-name");
        const idCard = draggedElement.getAttribute("data-id_carta");
        imageData.name = nameAttribute;
        imageData.id_carta = idCard;

        const canvas = event.target;
        canvas.classList.add("oculto");

        // Crear un nuevo elemento de imagen y mostrar la imagen en el área de caída
        const imgElement = document.createElement("img");
        imgElement.src = imageData.src;
        imgElement.dataset.name = imageData.name;
        imgElement.draggable = false;
        imgElement.dataset.tipo = imageData.tipo;
        imgElement.dataset.id = imageData.id_carta;
        imgElement.dataset.ataque = imageData.ataque;
        imgElement.dataset.defensa = imageData.defensa;

        // Preguntar al usuario si quiere colocar la carta en posición de ataque o defensa
        const isAttackPosition = window.confirm(
            "¿Deseas colocar la carta en posición de ataque?"
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
            imgElement.style.transform = "rotate(90deg)";
            imgElement.dataset.position = "defensa";

            defensa = document.createElement("p");
            defensa.setAttribute("id", `defense-campo-${imageData.id_carta}`);
            defensa.textContent = `${imageData.defensa}`;
            defensa.style.color = "red";
        } else {
            imgElement.dataset.position = "ataque";

            ataque = document.createElement("p");
            ataque.setAttribute("id", `ataque-campo-${imageData.id_carta}`);
            ataque.textContent = `${imageData.ataque}`;
            ataque.style.color = "green";
        }

        // Agregar la imagen al área de caída
        dropArea.dataset.status = "lleno-monstruo";
        dropArea.appendChild(imgElement);

        if (ataque) {
            dropArea.appendChild(ataque);
        }

        if (defensa) {
            dropArea.appendChild(defensa);
        }

        // reset de la mano
        const hand = document.getElementById("cartasManoPlayer");

        const handCard = hand.querySelector(`[data-id="${imageData.id}"]`);

        if (handCard) {
            handCard.src = "img/mazo.jpg";
            handCard.dataset.status = "vacio";
            handCard.dataset.tipo = "";
            handCard.dataset.ataque = "";
            handCard.dataset.defensa = "";
            handCard.dataset.name = "";
            handCard.dataset.img = "";
            handCard.draggable = true;

            const divContainer = handCard.closest(".fila");

            divContainer.classList.add("oculto");
            divContainer.classList.remove("mostrar");

            this.hasPlacedCard[player] = false;
        }
    };

    /* El código anterior es una función de JavaScript llamada `dropMagic` que se utiliza para manejar la
	caída de una carta de hechizo en un área de colocación específica. */
    dropMagic = (event, dropArea) => {
        event.preventDefault();

        if (dropArea.querySelector("img")) {
            alert("Ya hay una carta en esta área. Elige otro lugar.");
            return;
        }

        const jsonData = event.dataTransfer.getData("text/plain");
        const imageData = JSON.parse(jsonData);

        if (imageData.tipo !== "Spell Card") {
            alert("Solo puedes colocar cartas de hechizo en esta área.");
            return;
        }

        const draggedElement = document.querySelector(
            '.cartasacada[draggable="true"]:hover'
        );

        const idCard = draggedElement.getAttribute("data-id_carta");
        imageData.id_carta = idCard;

        const canvas = event.target;
        canvas.classList.add("oculto");

        // Crear un nuevo elemento de imagen y mostrar la imagen en el área de caída
        const imgElement = document.createElement("img");
        imgElement.src = "/img/mazo.jpg";

        // Agregar la imagen al área de caída
        dropArea.dataset.status = "lleno-magica";
        dropArea.appendChild(imgElement);

        // reset de la mano
        const hand = document.getElementById("cartasManoPlayer");

        // console.log(imageData.id);

        const handCard = hand.querySelector(`[data-id="${imageData.id}"]`);

        if (handCard) {
            handCard.src = "img/mazo.jpg";
            handCard.dataset.status = "vacio";
            handCard.dataset.tipo = "";
            handCard.dataset.ataque = "";
            handCard.dataset.defensa = "";
            handCard.dataset.name = "";
            handCard.dataset.img = "";
            handCard.draggable = true;

            const divContainer = handCard.closest(".fila");

            divContainer.classList.add("oculto");
            divContainer.classList.remove("mostrar");
        }
    };

    /* El código anterior agrega controladores de eventos de arrastrar y soltar a ciertos elementos de la
	página. Primero selecciona todos los elementos con la clase "cartasacada" que tienen el atributo
	"arrastrable" establecido en "verdadero". Luego agrega un detector de eventos "dragstart" a cada
	uno de estos elementos. */
    addDragAndDropHandlers = () => {
        const draggableElements = document.querySelectorAll(
            '.cartasacada[draggable="true"]'
        );

        draggableElements.forEach((element) => {
            element.addEventListener("dragstart", this.dragStart);
        });

        const dropAreasMonstruos = document.querySelectorAll(
            '.fila[data-categoria="monstruo-player"]'
        );
        const dropAreasMagicas = document.querySelectorAll(
            '.fila[data-categoria="magicas-player"]'
        );

        dropAreasMonstruos.forEach((area) => {
            area.addEventListener("dragover", this.allowDrop);
            area.addEventListener("drop", (event) =>
                this.dropMonster(event, area)
            );
        });

        dropAreasMagicas.forEach((area) => {
            area.addEventListener("dragover", this.allowDrop);
            area.addEventListener("drop", (event) =>
                this.dropMagic(event, area)
            );
        });
    };

    /* El código anterior define una función llamada "assembleDecks" en JavaScript. Esta función se
	encarga de crear dos mazos de cartas para un juego. */
    assembleDecks = () => {
        // Función para obtener una carta aleatoria según su tipo
        const getRandomCard = (type) => {
            const cards =
                type === "monster" ? this.cardsMonster : this.cardsSpell;
            return cards[Math.floor(Math.random() * cards.length)];
        };

        const deck1 = [];
        const deck2 = [];

        // Agregar cartas de monstruos a los mazos
        while (deck1.length < this.quantity / 2) {
            deck1.push(getRandomCard("monster"));
        }

        while (deck2.length < 40) {
            deck2.push(getRandomCard("monster"));
        }

        // Agregar cartas de hechizos a los mazos
        while (deck2.length < 40 + 10) {
            deck2.push(getRandomCard("spell"));
        }

        // Barajar los mazos
        deck1.sort(() => Math.random() - 0.5);
        deck2.sort(() => Math.random() - 0.5);

        this.decks.yugi = deck1;
        this.decks.player = deck2;
    };

    /* El código anterior es una función de JavaScript llamada "dealCards". Toma dos parámetros:
	`posiciones` (una matriz de posiciones) y `jugador` (una cadena que representa al jugador). */
    dealCards = (positions, player) => {
        let playerCards =
            player === "yugi" ? this.decks.yugi : this.decks.player;

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

            if (player === "player") {
                if (card.type === "Normal Monster") {
                    defensa = document.createElement("p");
                    defensa.setAttribute("id", `defense-${position}`);
                    defensa.textContent = `${card.defense}`;
                    defensa.style.color = "gray";

                    ataque = document.createElement("p");
                    ataque.setAttribute("id", `ataque-${position}`);
                    ataque.textContent = `${card.attack}`;
                    ataque.style.color = "green";

                    itemCard.insertAdjacentElement("afterend", defensa);
                    itemCard.insertAdjacentElement("afterend", ataque);
                }
            }

            itemCard.src = player === "yugi" ? "./img/mazo.jpg" : card.imageUrl;
            itemCard.dataset.name = card.name;
            itemCard.dataset.img = card.imageUrl;
            itemCard.dataset.tipo = card.type;
            itemCard.dataset.ataque = card.attack;
            itemCard.dataset.defensa = card.defense;
            itemCard.dataset.id_carta = card.id;
            itemCard.dataset.id = position;
        }

        this.decks[player] = this.decks[player].filter(
            (cartaIndex, index) =>
                !positions.includes(`c${player.charAt(0)}${index + 1}`)
        );
    };

    /* El código anterior define una función llamada `isMonsterDestroyed` en JavaScript. Esta función toma
	un parámetro "monsterId" y verifica si un monstruo con ese "monsterId" está destruido. */
    isMonsterDestroyed = (monsterId) => {
        const yugiMonsters = document.querySelectorAll(
            `[data-status="lleno-monstruo-yugi"] [data-position="ataque"][data-id="${monsterId}"]`
        );
        return yugiMonsters.length === 0;
    };

    /* El código anterior es una función de JavaScript llamada "getYugiMonstersAttack". Se utiliza para
	recuperar y actualizar una lista de monstruos Yu-Gi-Oh que están en posición de ataque. */
    getYugiMonstersAttack = () => {
        let yugiMonsters = document.querySelectorAll(
            '[data-status="lleno-monstruo-yugi"]'
        );

        // Filtrar la lista actualizada de monstruos en posición de ataque
        const updatedMonsters = Array.from(yugiMonsters).filter((monster) => {
            const img = monster.querySelector('img[data-position="ataque"]');
            const monsterInfo = img
                ? {
                      id: img.dataset.id,
                      position: img.dataset.position,
                      ataque: img.dataset.ataque,
                      defensa: img.dataset.defensa,
                      name: img.dataset.name,
                  }
                : null;

            return img && !this.isMonsterDestroyed(monsterInfo.id);
        });

        // Actualizar la lista con los monstruos que siguen en posición de ataque
        this.yugiMonstersInAttackPosition = updatedMonsters.map((monster) => ({
            id: monster.querySelector('img[data-position="ataque"]').dataset.id,
            position: monster.querySelector('img[data-position="ataque"]')
                .dataset.position,
            ataque: monster.querySelector('img[data-position="ataque"]').dataset
                .ataque,
            defensa: monster.querySelector('img[data-position="ataque"]')
                .dataset.defensa,
            name: monster.querySelector('img[data-position="ataque"]').dataset
                .name,
        }));

        // console.log(this.yugiMonstersInAttackPosition);
    };

    /* El código anterior es una función de JavaScript llamada "yugiRandomAttack". Es parte de un programa
	o lógica de juego más amplio relacionado con un juego de cartas. */
    yugiRandomAttack = () => {
        // Obtener monstruos de Yugi en posición de ataque
        let yugiMonsters = this.yugiMonstersInAttackPosition;

        // Verificar si Yugi tiene monstruos en posición de ataque
        if (yugiMonsters.length > 0) {
            // Seleccionar un monstruo aleatorio de Yugi
            const randomYugiMonster =
                yugiMonsters[Math.floor(Math.random() * yugiMonsters.length)];

            // Obtener monstruos del jugador
            let playerMonsters = document.querySelectorAll(
                '[data-status="lleno-monstruo"]'
            );

            // Verificar si el jugador tiene monstruos para atacar
            if (playerMonsters.length > 0) {
                // Seleccionar un monstruo aleatorio del jugador
                const randomPlayerMonster =
                    playerMonsters[
                        Math.floor(Math.random() * playerMonsters.length)
                    ];

                const playerMonsterInfo = {
                    id: randomPlayerMonster.querySelector("img").dataset.id,
                    position:
                        randomPlayerMonster.querySelector("img").dataset
                            .position,
                    ataque: randomPlayerMonster.querySelector("img").dataset
                        .ataque,
                    defensa:
                        randomPlayerMonster.querySelector("img").dataset
                            .defensa,
                    name: randomPlayerMonster.querySelector("img").dataset.name,
                };

                alert(
                    `Monstruo de Yugi ${randomYugiMonster.name} ataca a ${playerMonsterInfo.name}`
                );

                this.atkYugiCalculate(randomYugiMonster, playerMonsterInfo);
                this.updateProgressBars();
            } else {
                alert(
                    "El jugador no tiene monstruos para atacar. Se ataca directamente a los puntos de vida."
                );
                this.lpPlayer -= randomYugiMonster.ataque;
                this.updateProgressBars();
            }
        } else {
            alert("Yugi no tiene monstruos en posición de ataque.");
            return;
        }
    };

    /* El código anterior es una función de JavaScript llamada "atkYugiCalculate". Toma dos parámetros,
	`attackerInfo` y `defenderInfo`, que son objetos que contienen información sobre el atacante y el
	defensor. */
    atkYugiCalculate = (attackerInfo, defenderInfo) => {
        const attackerAttack = parseInt(attackerInfo.ataque);
        const defenderAttack = parseInt(defenderInfo.ataque);
        const defenderDefense = parseInt(defenderInfo.defensa);
        const defenderPosition = defenderInfo.position;

        switch (true) {
            case attackerAttack > defenderDefense &&
                defenderPosition === "defensa":
                // Caso 1: El ataque del atacante es mayor que la defensa del defensor en posición de defensa
                // Agregar lógica aquí para destruir el monstruo defensor en posición de defensa (si es necesario)

                // Ejemplo: Destruir el monstruo defensor en posición de defensa
                this.destroyMonsterPlayer(defenderInfo);

                // Restablecer variables después del ataque
                this.resetAfterAttack();

                return {
                    success: true,
                    message: "Se venció al monstruo del player en defensa",
                };

            case attackerAttack > defenderAttack &&
                defenderPosition === "ataque":
                // Caso 2: El ataque del atacante es mayor que el ataque del defensor en posición de ataque

                // Ejemplo: Destruir el monstruo defensor en posición de ataque
                this.destroyMonsterPlayer(defenderInfo);

                // Calcular el daño al LP del defensor
                this.damage = attackerAttack - defenderAttack;
                this.lpPlayer -= this.damage;

                // Restablecer variables después del ataque
                this.resetAfterAttack();

                return {
                    success: true,
                    message: "Se venció al monstruo del Player",
                };

            case attackerAttack < defenderAttack &&
                defenderPosition === "ataque":
                // Caso 3: El ataque del atacante es menor que el ataque del defensor en posición de ataque

                // Ejemplo: Destruir el monstruo atacante
                this.destroyMonsterYugi(attackerInfo);

                // Calcular el daño al LP del atacante
                this.damage = defenderAttack - attackerAttack;
                this.lpYugi -= this.damage;

                // Restablecer variables después del ataque
                this.resetAfterAttack();

                return {
                    success: false,
                    message:
                        "El ataque del jugador es menor que el ataque del atacante",
                };

            case attackerAttack === defenderAttack:
                // Caso 4: El ataque del atacante es igual al ataque del defensor

                // Ejemplo: Destruir ambos monstruos
                this.destroyMonsterPlayer(defenderInfo);
                this.destroyMonsterYugi(attackerInfo);

                // Restablecer variables después del ataque
                this.resetAfterAttack();

                return {
                    success: true,
                    message: "Se destruyeron ambos monstruos",
                };

            case attackerAttack === defenderDefense:
                // Caso 5: El ataque del atacante es igual a la defensa del defensor

                // Agregar lógica aquí para manejar el caso en que no ocurre daño

                // Restablecer variables después del ataque
                this.resetAfterAttack();

                return {
                    success: false,
                    message: "La defensa y el ataque son iguales.",
                };

            case attackerAttack < defenderDefense &&
                defenderPosition === "defensa":
                // Caso 6: El ataque del atacante es menor que la defensa del defensor en posición de defensa

                // Calcular el daño al LP del atacante
                this.damage = defenderDefense - attackerAttack;
                this.lpYugi -= this.damage;

                // Restablecer variables después del ataque
                this.resetAfterAttack();

                return {
                    success: false,
                    message:
                        "La defensa del monstruo defensor es mayor que el ataque",
                };

            default:
                // Otro caso no manejado
                return { success: false, message: "Caso no manejado" };
        }
    };

    /* El código anterior define una función llamada `resetAfterAttack` en JavaScript. Esta función
	restablece ciertas variables a sus valores iniciales después de un ataque. Específicamente,
	establece la variable `daño` en 0 y establece las variables `selectedPlayerMonster` y
	`selectedRivalMonster` en `null`. */
    resetAfterAttack = () => {
        this.damage = 0;
        this.selectedPlayerMonster = null;
        this.selectedRivalMonster = null;
    };

    /* El código anterior es una función de JavaScript llamada "drawPhaseComputer". Se encarga de sacar
	una carta del mazo y colocarla en la mano del jugador. */
    drawPhaseComputer = (player) => {
        const card = this.decks[player].shift();

        // DE LAS CARTAS QUE TIENE EN LA MANO, VER SI TIENE UN ESPACIO Y COLOCAR DICHA CARTA EN SU MANO
        const hand = document.getElementById(
            `cartasMano${player.charAt(0).toUpperCase()}${player.slice(1)}`
        );

        // Verificar si hay un espacio vacío en la mano
        const emptyHandSlot = hand.querySelector(`[data-status="vacio"]`);

        const divContainer = emptyHandSlot
            ? emptyHandSlot.closest(".fila")
            : null;

        if (divContainer) {
            divContainer.classList.add("mostrar");
            divContainer.classList.remove("oculto");
        }

        if (emptyHandSlot) {
            // Colocar la carta en la mano
            emptyHandSlot.src = "/img/mazo.jpg";
            emptyHandSlot.dataset.name = card.name;
            emptyHandSlot.dataset.img = card.imageUrl;
            emptyHandSlot.dataset.tipo = card.type;
            emptyHandSlot.dataset.ataque = card.attack;
            emptyHandSlot.dataset.defensa = card.defense;
            emptyHandSlot.dataset.id_carta = card.id;
            emptyHandSlot.dataset.status = "lleno";
            emptyHandSlot.dataset.id = emptyHandSlot.id;
        } else {
            alert(`¡El jugador ${player} ya tiene 7 cartas en la mano!`);
        }
    };

    /* El código anterior es una función de JavaScript llamada "mainPhaseComputer" que representa el turno
	de un jugador de computadora en un juego de cartas. */
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
        const monsterField = document.getElementById("campoAtaqueYugi");
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
            const canvasElement = availableMonsterArea.querySelector("canvas");
            // Agregar la clase 'oculto' al elemento canvas
            if (canvasElement) {
                canvasElement.classList.add("oculto");
                availableMonsterArea.dataset.status = "lleno-monstruo-yugi";
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

        const imgElement = document.createElement("img");
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

        const isAttackPosition = Math.random() < 0.7;

        if (!isAttackPosition) {
            // Si no es posición de ataque, cambiar el estilo y agregar el atributo de defensa
            imgElement.style.transform = "rotate(90deg)";
            imgElement.dataset.position = "defensa";

            defensa = document.createElement("p");
            defensa.setAttribute("id", `defense-${imageData.id}`);
            defensa.textContent = `${imageData.defensa}`;
            defensa.style.color = "red";
        } else {
            imgElement.dataset.position = "ataque";

            ataque = document.createElement("p");
            ataque.setAttribute("id", `ataque-${imageData.id}`);
            ataque.textContent = `${imageData.ataque}`;
            ataque.style.color = "green";
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
        randomHandCard.src = "img/mazo.jpg";
        randomHandCard.dataset.status = "vacio";
        randomHandCard.dataset.tipo = "";
        randomHandCard.dataset.ataque = "";
        randomHandCard.dataset.defensa = "";
        randomHandCard.dataset.img = "";
        randomHandCard.dataset.id_carta = "";
        randomHandCard.draggable = false;
        const divContainer2 = randomHandCard.closest(".fila");
        divContainer2.classList.add("oculto");
        divContainer2.classList.remove("mostrar");
        this.hasPlacedCard[player] = false;

        this.currentPhase = "battle";

        setTimeout(() => {
            alert(`Atk Phase Yugi Muto`);

            this.getYugiMonstersAttack();

            setTimeout(() => {
                this.yugiRandomAttack();
            }, 4000);
        }, 4000);
    };

    /* El código anterior define una función llamada "playComputer" en JavaScript. Esta función representa
	las acciones que realiza el jugador de la computadora (llamado 'yugi') durante su turno en un
	juego. */
    playComputer = () => {
        let player = "yugi"; // Yugi es la computadora en este caso

        // Colocar carta en mano
        const self = this;

        setTimeout(() => {
            alert("Draw Phase - Computer");
            self.drawPhaseComputer(player);
            self.updateTotalDeckCount(player);
            // Update Total Deck Count
            setTimeout(() => {
                alert("Main Phase - Computer");

                self.mainPhaseComputer(player);
            }, 2000);
        }, 2000);

        this.hasDrawnCard = {
            player: false,
            yugi: false,
        };
    };

    /* El código anterior es una función de JavaScript llamada "drawCard" que se utiliza para robar una
	carta para un jugador en un juego de cartas. */
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
            ? emptyHandSlot.closest(".fila")
            : null;

        if (divContainer) {
            divContainer.classList.add("mostrar");
            divContainer.classList.remove("oculto");
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
            emptyHandSlot.dataset.status = "lleno";
            emptyHandSlot.dataset.id = emptyHandSlot.id;

            if (card.type === "Normal Monster") {
                let defensa = document.createElement("p");
                defensa.setAttribute("id", `defense-${emptyHandSlot.id}`);
                defensa.textContent = `${card.defense}`;
                defensa.style.color = "gray";

                let ataque = document.createElement("p");
                ataque.setAttribute("id", `ataque-${emptyHandSlot.id}`);
                ataque.textContent = `${card.attack}`;
                ataque.style.color = "green";

                emptyHandSlot.insertAdjacentElement("afterend", defensa);
                emptyHandSlot.insertAdjacentElement("afterend", ataque);
            }
        } else {
            alert(
                `¡El jugador ${player} ya tiene 7 cartas en la mano! Se descarto la carta obtenida.`
            );
        }

        this.hasDrawnCard[player] = true;

        // console.log(`Carta robada por ${player}:`, card);
    };

    /* El código anterior define una función llamada "drawPhase" en JavaScript. */
    drawPhase = (player) => {
        const self = this;
        this.mainPhaseButton.disabled = true;
        this.battlePhaseButton.disabled = true;
        this.endPhaseButton.disabled = true;

        this.drawButton.style.backgroundColor = "green";
        this.mainPhaseButton.style.backgroundColor = "gray";
        this.battlePhaseButton.style.backgroundColor = "gray";
        this.endPhaseButton.style.backgroundColor = "gray";

        const deckElement = document.getElementById(
            `mazo${player.charAt(0).toUpperCase()}${player.slice(1)}`
        );

        if (deckElement && this.currentPlayer === 1 && player === "player") {
            if (!this.drawClickEventAdded) {
                // Añade el evento de clic
                this.drawClickEventAdded = true;
                deckElement.addEventListener("click", this.drawCardHandler);
            }
        }

        if (this.currentPlayer === 2 && player === "yugi") {
            this.playComputer();

            setTimeout(() => {
                self.endPhase();
            }, 22000);
        }
    };

    /* El código anterior define una función llamada `drawCardHandler` en JavaScript. Esta función se
	utiliza para manejar la lógica para robar una carta en un juego de cartas. */
    drawCardHandler = () => {
        if (
            this.currentPlayer === 1 &&
            this.currentPhase === "draw" &&
            !this.hasDrawnCard.player
        ) {
            this.currentPhase === "draw";
            this.hasDrawnCard = {
                ...this.hasDrawnCard,
                player: false,
            };

            // Devuelve temprano si ya tiene 7 cartas
            if (this.checkHandFull("player")) {
                this.currentPhase = "main";
                this.updateTotalDeckCount("player");
                this.mainPhase("player");
                return;
            }

            this.drawCard("player");
            this.currentPhase = "main";
            this.updateTotalDeckCount("player");
            this.mainPhase("player");
            // Desactiva el evento de clic después de usarlo
            this.drawClickEventAdded = false;
        }
    };

    /* El código anterior es una función de JavaScript llamada `checkHandFull` que toma un parámetro
	`player`. */
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

    /* El código anterior define una función llamada `atkPhase` en JavaScript. Esta función se utiliza
	para manejar la fase de ataque de un juego. */
    atkPhase = () => {
        if (this.turnCount === 1 && this.currentPlayer === 1) {
            alert("No puedes atacar en el primer turno.");
            return;
        }

        this.currentPhase = "battle";
        this.mainPhaseButton.disabled = true;
        this.mainPhaseButton.style.backgroundColor = "gray";
        this.battlePhaseButton.style.backgroundColor = "green";

        alert(`Atk Phase`);

        this.addClickEventToPlayerMonsters();
        this.addClickEventToRivalMonsters();
    };

    /* El código anterior agrega un detector de eventos de clic a los monstruos jugadores en un juego de
	cartas. Cuando un jugador hace clic en un monstruo de jugador, el código verifica si el monstruo
	está en posición de ataque y si ya ha atacado en el turno actual. Si se cumplen las condiciones, el
	código almacena la información del monstruo del jugador seleccionado en un objeto y alerta al
	jugador sobre la selección. Si no hay monstruos en el campo del oponente, el código le da al
	jugador la opción de atacar directamente los puntos de vida del oponente. Si el jugador selecciona
	dos monstruos, el código pasa a la fase de ataque. */
    addClickEventToPlayerMonsters = () => {
        const playerMonsters = document.querySelectorAll(
            '[data-status="lleno-monstruo"]'
        );

        if (playerMonsters.length === 0) {
            alert("No tienes monstruos para atacar");
            return;
        }

        if (this.selectedPlayerMonster !== null) {
            alert(
                "Ya has seleccionado un monstruo, selecciona un monstruo de yugi."
            );
            return;
        }

        playerMonsters.forEach((monster) => {
            const img = monster.querySelector("img");

            img.addEventListener("click", () => {
                const monsterId = img.dataset.id;

                if (img.dataset.position === "defensa") {
                    alert(
                        "No puedes atacar con un monstruo en posición de defensa."
                    );
                    return;
                }

                // Almacena la información del monstruo seleccionado en un objeto
                if (this.monstersAttackedStatus[monsterId]) {
                    alert(
                        "Este monstruo ya ha atacado en este turno. Selecciona otro monstruo o ataca directamente."
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
                        "Yugi no tiene monstruos en su campo. ¿Quieres atacar directamente sus puntos de vida?"
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

    /* El código anterior agrega un detector de eventos de clic a los monstruos rivales en un juego.
	Cuando se hace clic en un monstruo rival, el código almacena información sobre el monstruo
	seleccionado en un objeto. También comprueba si ya se ha seleccionado un monstruo rival y muestra
	un mensaje de alerta en consecuencia. Si se han seleccionado dos monstruos rivales, se activa la
	función attackPhasePlayer. */
    addClickEventToRivalMonsters = () => {
        const rivalMonsters = document.querySelectorAll(
            '[data-status="lleno-monstruo-yugi"]'
        );

        if (rivalMonsters.length === 0) {
            alert("Yugi no tiene monstruos en su campo.");
        }

        if (this.selectedRivalMonster !== null) {
            alert(
                "Ya has seleccionado un monstruo. No puedes seleccionar otro."
            );
            return;
        }

        rivalMonsters.forEach((monster) => {
            const img = monster.querySelector("img");

            img.addEventListener("click", () => {
                if (this.selectedRivalMonster !== null) {
                    alert(
                        "Ya has seleccionado un monstruo. No puedes seleccionar otro."
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

    /* El código anterior define una función attackPhasePlayer en JavaScript. */
    attackPhasePlayer = () => {
        // Verifica que se hayan seleccionado ambos monstruos
        if (!this.selectedPlayerMonster || !this.selectedRivalMonster) {
            alert("Debes seleccionar ambos monstruos antes de atacar.");
            return;
        }

        // Verifica que el monstruo del jugador esté en posición de ataque
        if (this.selectedPlayerMonster.position !== "ataque") {
            alert(
                "El monstruo del jugador debe estar en posición de ataque para atacar."
            );
            return;
        }

        // Verifica la posición del monstruo rival y realiza el cálculo del ataque
        const data = this.calculateAttackResult(
            this.selectedPlayerMonster,
            this.selectedRivalMonster
        );

        // Reinicia las variables de monstruos seleccionados
        this.damage = 0;
        this.selectedMonstersCount = 0;
        this.selectedPlayerMonster = null;
        this.selectedRivalMonster = null;
        this.updateProgressBars();
    };

    /* El código anterior es una función de JavaScript llamada "calculateAttackResult" que calcula el
	resultado de un ataque entre un atacante y un defensor en un juego. */
    calculateAttackResult = (attacker, defender) => {
        const attackerAttack = parseInt(attacker.ataque);
        const defenderAttack = parseInt(defender.ataque);
        const defenderDefense = parseInt(defender.defensa);

        switch (true) {
            case attackerAttack > defenderDefense &&
                defender.position === "defensa":
                // Caso 1: El ataque de selectedPlayerMonster es mayor que la defensa de selectedRivalMonster en posición de defensa
                // Agregar lógica aquí para destruir el monstruo rival en posición de defensa (si es necesario)

                this.destroyMonsterYugi(defender);

                this.resetAfterAttack();

                return {
                    success: true,
                    message: "Se vencio al monstruo de yugi en defensa",
                };

            case attackerAttack > defenderAttack &&
                defender.position === "ataque":
                // Caso 2: El ataque de selectedPlayerMonster es mayor que el ataque de selectedRivalMonster en posición de ataque

                this.destroyMonsterYugi(defender);
                this.damage = attackerAttack - defenderAttack;
                this.lpYugi -= this.damage; // Restar la diferencia al LP de Yugi

                this.resetAfterAttack();

                return {
                    success: true,
                    message: "Se vencio al monstruo de yugi",
                };

            case attackerAttack < defenderAttack &&
                defender.position === "ataque":
                // Caso 3: El ataque de selectedPlayerMonster es menor que el ataque de selectedRivalMonster en posición de ataque
                this.destroyMonsterPlayer(attacker);

                this.damage = defenderAttack - attackerAttack;
                this.lpPlayer -= this.damage; // Restar la diferencia al LP de Player

                this.resetAfterAttack();

                return {
                    success: false,
                    message:
                        "El ataque de Player es menor que el ataque de Yugi",
                };

            case attackerAttack === defenderAttack:
                // Caso 4: El ataque de selectedPlayerMonster es igual al ataque de selectedRivalMonster
                // Agregar lógica aquí para destruir ambos monstruos (si es necesario)
                this.destroyMonsterPlayer(attacker);

                this.destroyMonsterYugi(defender);

                this.resetAfterAttack();

                return {
                    success: true,
                    message: "Se destruyeron ambos monstruos",
                };

            case attackerAttack === defenderDefense:
                // Caso 5: El ataque de selectedPlayerMonster es igual a la defensa de selectedRivalMonster
                // Agregar lógica aquí para manejar el caso en que no ocurre daño
                this.resetAfterAttack();

                return {
                    success: false,
                    message: "La defensa y el ataque son iguales.",
                };

            case attackerAttack < defenderDefense &&
                defender.position === "defensa":
                // Caso 6: El ataque de selectedPlayerMonster es menor que la defensa de selectedRivalMonster en posición de defensa
                this.damage = defenderDefense - attackerAttack;
                this.lpPlayer -= this.damage; // Restar la diferencia al LP de Player
                this.resetAfterAttack();

                return {
                    success: false,
                    message:
                        "La defensa del monstruo atacado es mayor que el ataque",
                };
        }

        this.damage = 0;
        this.selectedPlayerMonster = null;
        this.selectedRivalMonster = null;

        return { success: false };
    };

    /* El código anterior es una función de JavaScript llamada "destroyMonsterYugi". Destruye visualmente al monstruo del Player y coloca nuevamente el canvas. */
    destroyMonsterYugi = (defender) => {
        let playerMonsterYugiDivs;

        playerMonsterYugiDivs = document.querySelectorAll(
            `[data-status="lleno-monstruo-yugi"]`
        );

        for (const div of playerMonsterYugiDivs) {
            const img = div.querySelector("img");
            if (img && img.dataset.id === defender.id) {
                const canvas = div.querySelector("canvas");
                const p = div.querySelector("p");

                div.setAttribute("data-status", "vacio-monstruo-yugi");
                img.remove();
                p.remove();
                canvas.classList.remove("oculto");

                break;
            }
        }

        playerMonsterYugiDivs = null;
    };

    /* El código anterior es una función de JavaScript llamada "destroyMonsterPlayer". Destruye visualmente al monstruo del Player y coloca nuevamente el canvas. */
    destroyMonsterPlayer = (attacker) => {
        let playerMonsterPlayerDivs;

        playerMonsterPlayerDivs = document.querySelectorAll(
            `[data-status="lleno-monstruo"]`
        );

        for (const div of playerMonsterPlayerDivs) {
            const img = div.querySelector("img");
            if (img && img.dataset.id === attacker.id) {
                const canvas = div.querySelector("canvas");
                const p = div.querySelector("p");

                div.setAttribute("data-status", "vacio-monstruo");
                img.remove();
                p.remove();
                canvas.classList.remove("oculto");

                break; // Rompe el bucle si se encuentra la coincidencia
            }
        }

        playerMonsterPlayerDivs = null;
    };

    /* El código anterior define una función llamada "mainPhase" en JavaScript. Esta función se utiliza
	para manejar la fase principal de un juego para un jugador específico. */
    mainPhase = (player) => {
        this.mainPhaseButton.disabled = false;
        this.battlePhaseButton.disabled = false;
        this.endPhaseButton.disabled = false;
        this.drawButton.disabled = true;

        this.drawButton.style.backgroundColor = "gray";
        this.mainPhaseButton.style.backgroundColor = "green";
        this.battlePhaseButton.style.backgroundColor = "blue";
        this.endPhaseButton.style.backgroundColor = "blue";

        alert(`Jugador ${player} en la Main Phase.`);

        this.hasPlacedCard[player] = true;
    };

    /* El código anterior es una función de JavaScript llamada "changeTurn". Se utiliza para cambiar el
	turno en un juego. */
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
            this.drawPhase("player");
        }

        // Si es el turno de Yugi, realiza automáticamente algunas acciones después de un retraso
        if (this.currentPlayer === 2) {
            this.mainPhaseButton.disabled = true;
            this.battlePhaseButton.disabled = true;
            this.endPhaseButton.disabled = true;
            this.drawButton.disabled = true;

            this.drawButton.style.backgroundColor = "gray";
            this.mainPhaseButton.style.backgroundColor = "gray";
            this.battlePhaseButton.style.backgroundColor = "gray";
            this.endPhaseButton.style.backgroundColor = "gray";

            this.drawPhase("yugi");

            setTimeout(function () {
                // Ahora puedes acceder a self para referirte al contexto de la clase
                this.mainPhaseButton.disabled = true;
                this.battlePhaseButton.disabled = true;
                this.endPhaseButton.disabled = true;
                this.drawButton.disabled = false;

                this.drawButton.style.backgroundColor = "green";
                this.mainPhaseButton.style.backgroundColor = "gray";
                this.battlePhaseButton.style.backgroundColor = "gray";
                this.endPhaseButton.style.backgroundColor = "gray";

                // self.endPhase();
            }, 1000); // Simula un retraso de 2 segundos antes de que Yugi finalice su turno
        }

        // Limpiar turno de jugadores
        this.hasDrawnCard = {
            yugi: false,
            player: false,
        };
    };

    /* El código anterior define una función llamada "endPhase" en JavaScript. Esta función establece el
	valor de `this.currentPhase` en 'draw' y luego llama a otra función llamada `changeTurn()`. */
    endPhase = () => {
        this.currentPhase = "draw";
        this.changeTurn();
    };

    /* El código anterior define una función llamada `getTotalDeckCount` en JavaScript. Esta función toma
	un parámetro llamado "jugador" y devuelve el número total de cartas en el mazo del jugador. El
	código supone que hay un objeto llamado "barajas" con propiedades que representan la baraja de cada
	jugador, y cada valor de propiedad es una matriz que representa las cartas en la baraja de ese
	jugador. */
    getTotalDeckCount = (player) => {
        // Lógica para obtener el total de cartas en el mazo del jugador
        return this.decks[player].length;
    };

    /* El código anterior define una función llamada `updateTotalDeckCount` en JavaScript. Esta función
	toma un parámetro llamado `jugador`. */
    updateTotalDeckCount = (player) => {
        const totalDeckElement = document.getElementById(
            `totalDeck${player.charAt(0).toUpperCase()}${player.slice(1)}`
        );

        if (totalDeckElement) {
            const totalDeckCount = this.getTotalDeckCount(player);
            totalDeckElement.innerHTML = `<h5>${totalDeckCount}</h5>`;
            totalDeckElement.classList.add("text-white");
        }
    };

    /* El código anterior es una función de JavaScript llamada "updateProgressBars". Es responsable de
	actualizar las barras de progreso y el texto para el jugador y Yugi en un juego. */
    updateProgressBars = () => {
        // Actualiza la barra de progreso del jugador
        const playerProgressBar = document.getElementById("playerProgressBar");
        playerProgressBar.value = this.lpPlayer;
        document.getElementById(
            "playerLpText"
        ).textContent = `LP: ${this.lpPlayer}`;

        // Actualiza la barra de progreso de Yugi
        const yugiProgressBar = document.getElementById("yugiProgressBar");
        yugiProgressBar.value = this.lpYugi;
        document.getElementById(
            "yugiLpText"
        ).textContent = `LP: ${this.lpYugi}`;

        // Verifica si el juego debe terminar
        if (this.lpPlayer <= 0) {
            // Establece el valor de las barras de progreso en 0
            playerProgressBar.value = 0;
            document.getElementById(
                "playerLpText"
            ).textContent = `LP: ${this.lpPlayer}`;

            // Muestra un mensaje indicando el resultado del juego
            const user = JSON.parse(sessionStorage.getItem("user"));

            firebase.updateData(user.id, false);

            setTimeout(async () => {
                const newDataUser = await firebase.updateSessionFirebase(
                    user.id
                );

                if (newDataUser && newDataUser.data) {
                    // Actualiza sessionStorage con los nuevos datos
                    const updatedUser = {
                        id: user.id,
                        data: {
                            name: newDataUser.data.name,
                            victories: newDataUser.data.victories,
                            losses: newDataUser.data.losses,
                            email: newDataUser.data.email,
                        },
                    };

                    // Convierte el objeto actualizado a cadena JSON y guárdalo en sessionStorage
                    sessionStorage.setItem("user", JSON.stringify(updatedUser));
                }

                alert("¡Yugi gana!");

            this.resetGameWithConfirmation();
            }, 1500);

            
        }

        if (this.lpYugi <= 0) {
            // Establece el valor de las barras de progreso en 0
            yugiProgressBar.value = 0;
            document.getElementById(
                "yugiLpText"
            ).textContent = `LP: ${this.lpYugi}`;

            const user = JSON.parse(sessionStorage.getItem("user"));

            firebase.updateData(user.id, true);

            setTimeout(async () => {
                const newDataUser = await firebase.updateSessionFirebase(
                    user.id
                );

                if (newDataUser && newDataUser.data) {
                    // Actualiza sessionStorage con los nuevos datos
                    const updatedUser = {
                        id: user.id,
                        data: {
                            name: newDataUser.data.name,
                            victories: newDataUser.data.victories,
                            losses: newDataUser.data.losses,
                            email: newDataUser.data.email,
                        },
                    };

                    // Convierte el objeto actualizado a cadena JSON y guárdalo en sessionStorage
                    sessionStorage.setItem("user", JSON.stringify(updatedUser));

                    alert("¡GANASTE FELICIDADES!");

                    this.resetGameWithConfirmation();
                }
            }, 1500); 
        }
    };

    /* El código anterior es una función de JavaScript llamada "resetGameWithConfirmation". Le muestra al
	usuario un cuadro de diálogo de confirmación que le pregunta si desea reiniciar el juego. Si el
	usuario confirma, la función recarga la página, reiniciando efectivamente el juego. */
    resetGameWithConfirmation = () => {
        // Pregunta al jugador si realmente desea reiniciar el juego
        const shouldReset = window.confirm("¿Quieres volver a jugar?");

        if (shouldReset) {
            // Si el jugador confirma, recarga la página para reiniciar el juego
            window.location.reload();
        } else {
            Session.outSession();
        }
    };

    /* El código anterior define una función llamada "showDecks" en JavaScript. Sin embargo, el cuerpo de
	la función está comentado, por lo que actualmente no está haciendo nada. Las líneas comentadas
	sugieren que la función podría estar destinada a registrar el contenido de dos mazos, "Mazo de
	Yugi" y "Mazo de Player", pero esta funcionalidad está actualmente deshabilitada. */
    showDecks = () => {
        // console.log('Mazo de Yugi:', this.decks.yugi);
        // console.log('Mazo de Player:', this.decks.player);
    };

    /* El código anterior define una función llamada `loadImage` en JavaScript. Esta función se encarga de
    cargar una imagen y mostrarla en una página web. */
    loadImage = () => {
        const imgPlayerElement = document.getElementById("img_player");
        const img = sessionStorage.getItem("img");

        // Verifica si el elemento y la imagen existen antes de actualizar el contenido
        if (imgPlayerElement && img) {
            // Crea un elemento de imagen y establece su atributo src
            const imgElement = document.createElement("img");
            imgElement.src = `../img/personajes/${img}.png`;
            imgElement.style.width = "auto";
            imgElement.style.height = "120px";

            // Agrega la imagen al elemento con id "img_player"
            imgPlayerElement.appendChild(imgElement);
        }

        const user = JSON.parse(sessionStorage.getItem("user"));

        // Verifica si user tiene datos válidos
        if (user && user.data) {
            // Obtén las victorias y las derrotas del objeto de usuario
            const victories = user.data.victories || 0;
            const losses = user.data.losses || 0;

            // Actualiza el contenido de los elementos <p> con las victorias y derrotas
            document.getElementById("win").textContent = `Win: ${victories}`;
            document.getElementById("los").textContent = `Losses: ${losses}`;
        }
    };
}

export default YugiohGame;
