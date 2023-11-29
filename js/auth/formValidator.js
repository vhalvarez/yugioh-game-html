export class FormValidator {
	constructor(email, name, password) {
		this.email = email;
		this.name = name || null;
		this.password = password;
	}

	isValidEmail() {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(this.email);
	}

	isValidName() {
		return this.name.length >= 3;
	}

	isValidPassword() {
		return this.password.length >= 6;
	}

	validateRegister() {
		if (!this.isValidEmail()) {
			return 'Por favor, ingresa una dirección de correo electrónico válida.';
		} else if (!this.isValidName()) {
			return 'Por favor, ingresa un nombre válido (al menos 3 caracteres).';
		} else if (!this.isValidPassword()) {
			return 'Por favor, ingresa una contraseña válida (al menos 6 caracteres).';
		} else {
			return null; // Indica que todos los datos son válidos
		}
	}

	validateLogin() {
		if (!this.isValidEmail()) {
			return 'Por favor, ingresa una dirección de correo electrónico válida.';
		} else if (!this.isValidPassword()) {
			return 'Por favor, ingresa una contraseña válida (al menos 6 caracteres).';
		} else {
			return null; // Indica que todos los datos son válidos
		}
	}
}
