import { Figure } from './figure.js';
import { Session } from '../auth/session.js'

// Verifica si el usuario está autenticado
if (!Session.isUserLoggedIn()) {
    // Si no está autenticado, redirige a la página de inicio de sesión
    location.href = "../login.html";
}

// Crear una instancia de la clase Figure
const character = new Figure();

// Función para manejar la elección del personaje
window.chooseCharacter = function (value) {
	character.chooseCharacter(value);
};

