const BASE = "https://plain-frog-28dcsubtle.gauravjain0762.workers.dev";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sk_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: "POST",  body: JSON.stringify(body) }),
  put:    (path, body)   => request(path, { method: "PUT",   body: JSON.stringify(body) }),
  patch:  (path, body)   => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: "DELETE" }),
};
