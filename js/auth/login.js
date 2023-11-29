import { firebase } from './firebase.js';
import { FormValidator } from './formValidator.js';
import { Session } from './session.js';

const signinForm = document.getElementById('signin-form');

signinForm.addEventListener('submit', async (e) => {
	e.preventDefault();

	const signinEmail = document.getElementById('signin-email').value;
	const signinPassword = document.getElementById('signin-password').value;

	const formValidator = new FormValidator(signinEmail, null, signinPassword);

	// Validar los datos antes de procesarlos
	const validationMessage = formValidator.validateLogin();

	if (validationMessage) {
		Toastify({
			text: validationMessage,
			className: 'info',
			duration: 3000,
		}).showToast();
	} else {
		firebase.findUser(signinEmail, signinPassword).then((data) => {
			// console.log(data);
			if (data && Object.keys(data).length > 0) {
				// El usuario existe, puedes realizar acciones aquí
				Session.createSession(data);
                location.href = "../instructions.html";
			} else {
				// El usuario no existe
				Toastify({
					text: 'No se puedo ingresar, vuelva a intentarlo...',
					className: 'error',
					duration: 3000,
				}).showToast();
			}
		});
	}
});
