export class Figure {
	chooseCharacter = (value) => {
		sessionStorage.setItem('img', value);

		location.href = 'preview.html';
	};
}
