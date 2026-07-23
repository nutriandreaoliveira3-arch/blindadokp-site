var BlindadoAuth = (function () {
  var TOKEN_KEY = "blindadokp_token";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function login(email, password) {
    var res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível entrar.");
    setToken(data.token);
    return data;
  }

  async function setPassword(token, password) {
    var res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, password: password }),
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível criar a senha.");
    setToken(data.token);
    return data;
  }

  // Retorna a lista de chaves de produto que a pessoa logada comprou
  // (ex.: ["rota_blindada_pro"]). Lista vazia se não estiver logada ou não tiver comprado nada.
  async function getEntitlements() {
    var token = getToken();
    if (!token) return [];
    try {
      var res = await fetch("/api/access", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) logout();
        return [];
      }
      var data = await res.json();
      return data.products || [];
    } catch (err) {
      return [];
    }
  }

  return { getToken: getToken, setToken: setToken, logout: logout, login: login, setPassword: setPassword, getEntitlements: getEntitlements };
})();
