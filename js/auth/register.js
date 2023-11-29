import { firebase } from './firebase.js';
import { FormValidator } from './formValidator.js';

const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (e) => {
	e.preventDefault();

	const signupEmail = document.getElementById('signup-email').value;
	const signupName = document.getElementById('signup-name').value;
	const signupPassword = document.getElementById('signup-password').value;

	const formValidator = new FormValidator(
		signupEmail,
		signupName,
		signupPassword
	);

	// Validar los datos antes de procesarlos
	const validationMessage = formValidator.validateRegister();

	if (validationMessage) {
		Toastify({
			text: validationMessage,
			className: 'info',
			duration: 3000,
		}).showToast();
	} else {
		const user = {
			email: signupEmail,
			name: signupName,
			password: signupPassword,
			victories: 0,
			losses: 0,
		};

		const userExists = await firebase.userExists(user);

		if (userExists) {
			Toastify({
				text: 'El usuario ya existe',
				className: 'error',
				duration: 3000,
			}).showToast();
		} else {
			firebase.registerUser(user);

			Toastify({
				text: 'Usuario creado',
				className: 'success',
				duration: 3000,
			}).showToast();

			// Redirige a la página de inicio de sesión después de 3 segundos
			setTimeout(() => {
				location.href = './login.html';
			}, 3000);
		}
	}
});
