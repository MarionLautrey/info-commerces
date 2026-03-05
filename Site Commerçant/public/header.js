// Vérifie la session
let session = JSON.parse(localStorage.getItem('session'));
if (!session || !session.id_compte || !session.token) {
  window.location.href = 'login.html';
}

// Bouton Actualité
document.getElementById('btnActualite')?.addEventListener('click', () => {
  window.location.href = 'actualite.html';
});

// Déconnexion
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch('/sessions/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: session.token })
  });
  localStorage.clear();
  window.location.href = 'login.html';
});
// Ce code appartient à la société IDEAL SOLUTIONS