import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    limit,
    FieldValue,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

/* La clase Firebase es una clase de JavaScript que proporciona métodos para la autenticación y el
registro de usuarios mediante Firebase. */
class Firebase {
    constructor(config) {
        this.app = initializeApp(config);
        this.db = getFirestore();
        this.user = {};
    }

    /* El método `userExists` es una función que verifica si un usuario con un correo electrónico
	específico ya existe en la base de datos de Firebase. */
    userExists = async (user) => {
        let status = false;

        const isExists = query(
            collection(this.db, "users"),
            where("email", "==", user.email)
        );

        const result = await getDocs(isExists);

        result.forEach((doc) => {
            if (doc.data()) status = true;
        });

        return status;
    };

    /* El método `findUser` es una función que busca un usuario en la base de datos de Firebase en función
	de su correo electrónico y contraseña. */
    findUser = async (email, password) => {
        const self = this;

        const isExists = query(
            collection(this.db, "users"),
            where("email", "==", email),
            where("password", "==", password),
            limit(1)
        );

        const querySnapshot = await getDocs(isExists);

        querySnapshot.forEach((doc) => {
            if (doc.exists) {
                self.user = {
                    id: doc.id,
                    data: { ...doc.data(), password: undefined },
                };
            }
        });

        return self.user;
    };

    /* El método `registerUser` es una función que toma un objeto `user` como parámetro y lo agrega a la
	colección "users" en la base de datos de Firebase Firestore. Utiliza la función `addDoc` de la
	biblioteca Firebase Firestore para agregar el documento a la colección. La `colección (this.db,
	'users')` especifica la colección a la que agregar el documento, y `user` son los datos que se
	agregarán. */
    registerUser = (user) => {
        addDoc(collection(this.db, "users"), user);
    };

    updateSessionFirebase = async (id) => {
        const usuarioDoc = doc(this.db, "users", id);
        const docSnap = await getDoc(usuarioDoc);
        const user = { id, data: { ...docSnap.data(), password: undefined } };
        return user;
    };

    updateData = async (id, status) => {
        const usuarioDoc = doc(this.db, "users", id);
        const docSnap = await getDoc(usuarioDoc);
        const result = docSnap.data();

        if (status) {
            const actualizacion = { victories: result.victories + 1 };
            updateDoc(usuarioDoc, actualizacion)
                .then((data) => {
                    return;
                })
                .catch((error) => {
                    console.error("Error al actualizar el registro:", error);
                });
        } else {
            const actualizacion = { losses: result.losses + 1 };
            updateDoc(usuarioDoc, actualizacion)
                .then(() => {
                    return;
                })
                .catch((error) => {
                    console.error("Error al actualizar el registro:", error);
                });
        }
    };
}

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCa6waQtorFAvw0ETScna-6ojw3AqvwzVA",
    authDomain: "yugioh-fe149.firebaseapp.com",
    projectId: "yugioh-fe149",
    storageBucket: "yugioh-fe149.appspot.com",
    messagingSenderId: "1017689667213",
    appId: "1:1017689667213:web:f7f1d48d0da19490fc54c4",
};

export const firebase = new Firebase(firebaseConfig);
