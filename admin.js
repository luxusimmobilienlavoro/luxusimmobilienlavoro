import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById('login-view');
const dashView = document.getElementById('dash-view');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const appsList = document.getElementById('apps-list');

let allApps = [];

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  toggleViews(!!session);
  if (session) loadApps();
}

function toggleViews(isLoggedIn) {
  loginView.hidden = isLoggedIn;
  dashView.hidden = !isLoggedIn;
  logoutBtn.hidden = !isLoggedIn;
}

checkSession();

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Connexion...';

  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  
  btn.disabled = false;
  btn.textContent = 'Se connecter';

  if (error) {
    loginError.textContent = 'Identifiants invalides.';
    loginError.hidden = false;
  } else {
    toggleViews(true);
    loadApps();
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  toggleViews(false);
  loginForm.reset();
});

async function loadApps() {
  appsList.innerHTML = '<p class="empty-state">Chargement des données...</p>';
  const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });

  if (error) {
    appsList.innerHTML = '<p class="empty-state" style="color:var(--error)">Erreur de chargement.</p>';
    return;
  }
  allApps = data;
  render();
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusLabels = { nouveau: 'Nouveau', encours: 'En cours', accepte: 'Accepté', refuse: 'Refusé' };
const badgeClass = (s) => ({ nouveau: 'badge-nouveau', encours: 'badge-encours', accepte: 'badge-accepte', refuse: 'badge-refuse' }[s] || 'badge-nouveau');

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

async function getSignedUrl(url) {
  if (!url) return '';
  // On extrait le chemin du fichier depuis l'URL publique stockée en base
  const path = url.split('/applications/')[1];
  if (!path) return url;
  
  // On demande à Supabase un lien temporaire de 60 minutes
  const { data, error } = await supabase.storage.from('applications').createSignedUrl(path, 3600);
  if (error) return url;
  return data.signedUrl;
}

async function render() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const filter = document.getElementById('filter-status').value;

  let list = allApps.filter((a) => {
    const hay = `${a.nom || ''} ${a.email || ''} ${a.pays || ''} ${a.docType || ''} ${a.adresse || ''}`.toLowerCase();
    const okSearch = !search || hay.includes(search);
    const okFilter = !filter || (a.status || 'nouveau') === filter;
    return okSearch && okFilter;
  });

  const today = new Date().toDateString();
  document.getElementById('stat-total').textContent = allApps.length;
  document.getElementById('stat-new').textContent = allApps.filter(a => (a.status || 'nouveau') === 'nouveau').length;
  document.getElementById('stat-cdi').textContent = allApps.filter(a => a.typeContrat === 'CDI').length;
  document.getElementById('stat-today').textContent = allApps.filter(a => a.created_at && new Date(a.created_at).toDateString() === today).length;

  if (!list.length) {
    appsList.innerHTML = '<p class="empty-state">Aucune candidature trouvée.</p>';
    return;
  }

  // Génération du HTML avec des placeholders pour les images
  const htmlPromises = list.map(async (a) => {
    const s = a.status || 'nouveau';
    
    // On génère les liens sécurisés
    const rectoUrl = await getSignedUrl(a.doc_recto_url);
    const versoUrl = await getSignedUrl(a.doc_verso_url);
    const selfieUrl = await getSignedUrl(a.selfie_url);

    return `
    <article class="app-card">
      <div class="app-head">
        <div>
          <h3>${esc(a.nom || 'Sans nom')}</h3>
          <p>${esc(a.email || '—')} · ${esc(a.pays || '—')} · ${formatDate(a.created_at)}</p>
        </div>
        <span class="badge ${badgeClass(s)}">${statusLabels[s] || s}</span>
      </div>

      <div class="app-grid">
        <div><span>Adresse</span><p>${esc(a.adresse || '—')}</p></div>
        <div><span>Expériences</span><p>${esc(a.experiences || '—')}</p></div>
        <div><span>Dispo 7j/7</span><p>${esc(a.dispo7j || '—')}</p></div>
        <div><span>Autre travail</span><p>${esc(a.autreTravail || '—')}</p></div>
        <div><span>Autre contrat</span><p>${esc(a.autreContrat || '—')}</p></div>
        <div><span>Contrat</span><p>${esc(a.typeContrat || '—')}</p></div>
        <div><span>Temps</span><p>${esc(a.tempsTravail || '—')}</p></div>
        <div><span>Formation</span><p>${esc(a.formation || '—')}</p></div>
        <div><span>Salaire</span><p>${esc(a.salaire || '—')}</p></div>
        <div><span>Document</span><p>${esc(a.docType || '—')}</p></div>
      </div>

      <div class="app-photos">
        ${rectoUrl ? `<a href="${rectoUrl}" target="_blank"><img src="${rectoUrl}"><div class="ph-label">Recto</div></a>` : ''}
        ${versoUrl ? `<a href="${versoUrl}" target="_blank"><img src="${versoUrl}"><div class="ph-label">Verso</div></a>` : ''}
        ${selfieUrl ? `<a href="${selfieUrl}" target="_blank"><img src="${selfieUrl}"><div class="ph-label">Selfie</div></a>` : ''}
      </div>

      <div class="app-foot">
        <select data-action="status" data-id="${a.id}">
          <option value="nouveau" ${s === 'nouveau' ? 'selected' : ''}>Nouveau</option>
          <option value="encours" ${s === 'encours' ? 'selected' : ''}>En cours</option>
          <option value="accepte" ${s === 'accepte' ? 'selected' : ''}>Accepté</option>
          <option value="refuse" ${s === 'refuse' ? 'selected' : ''}>Refusé</option>
        </select>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${a.id}">Supprimer</button>
      </div>
    </article>`;
  });

  const htmlArray = await Promise.all(htmlPromises);
  appsList.innerHTML = htmlArray.join('');
}

// ... Le reste du code (les écouteurs d'événements pour le changement de statut, la suppression, l'export CSV) reste identique ...
