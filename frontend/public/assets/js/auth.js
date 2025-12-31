// Simple auth helper: refreshes access token and provides a fetch wrapper

async function refreshAccessToken() {
  try {
    const res = await fetch("http://localhost:5000/api/v1/user/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem("token", data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (err) {
    console.error("refreshAccessToken error:", err);
    return null;
  }
}

// get token from storage
function getStoredToken() {
  return localStorage.getItem("token");
}

// helper: fetch with automatic refresh on 401
async function fetchWithAuth(input, init = {}) {
  init.credentials = init.credentials || "include";
  init.headers = init.headers || {};

  let token = getStoredToken();
  if (token) {
    init.headers["Authorization"] = `Bearer ${token}`;
    // also keep old `token` header for compatibility with backend
    init.headers["token"] = token;
  }

  let res = await fetch(input, init);

  if (res.status === 401) {
    // try refresh once
    const newToken = await refreshAccessToken();
    if (newToken) {
      init.headers["Authorization"] = `Bearer ${newToken}`;
      init.headers["token"] = newToken;
      res = await fetch(input, init);
    }
  }

  return res;
}

// auto-refresh on page load to get an access token if we only have refresh cookie
window.addEventListener("load", async () => {
  const token = getStoredToken();
  if (!token) {
    await refreshAccessToken();
  }
});
