export class Session
{
    static createSession(user)
    {
        sessionStorage.setItem("user", JSON.stringify(user))
    }

    static outSession()
    {
        sessionStorage.clear();
        location.href = "../login.html";
    }

    static isUserLoggedIn() {
        return !!sessionStorage.getItem("user");
    }
}
