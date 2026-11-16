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

function render() {
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

  appsList.innerHTML = list.map((a) => {
    const s = a.status || 'nouveau';
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
        ${a.doc_recto_url ? `<a href="${a.doc_recto_url}" target="_blank"><img src="${a.doc_recto_url}"><div class="ph-label">Recto</div></a>` : ''}
        ${a.doc_verso_url ? `<a href="${a.doc_verso_url}" target="_blank"><img src="${a.doc_verso_url}"><div class="ph-label">Verso</div></a>` : ''}
        ${a.selfie_url ? `<a href="${a.selfie_url}" target="_blank"><img src="${a.selfie_url}"><div class="ph-label">Selfie</div></a>` : ''}
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
  }).join('');
}

appsList.addEventListener('change', async (e) => {
  const sel = e.target.closest('select[data-action="status"]');
  if (!sel) return;
  sel.disabled = true;
  const { error } = await supabase.from('applications').update({ status: sel.value }).eq('id', sel.dataset.id);
  if (error) { alert('Erreur modification'); sel.disabled = false; return; }
  const local = allApps.find((a) => a.id === sel.dataset.id);
  if (local) local.status = sel.value;
  render();
});

appsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;
  if (!confirm('Supprimer définitivement ?')) return;
  btn.disabled = true;
  const { error } = await supabase.from('applications').delete().eq('id', btn.dataset.id);
  if (error) { alert('Erreur suppression'); btn.disabled = false; return; }
  allApps = allApps.filter((a) => a.id !== btn.dataset.id);
  render();
});

document.getElementById('search').addEventListener('input', render);
document.getElementById('filter-status').addEventListener('change', render);
document.getElementById('refresh').addEventListener('click', loadApps);

document.getElementById('export-csv').addEventListener('click', () => {
  if (!allApps.length) return alert('Aucune candidature.');
  const headers = ['Date','Nom','Email','Adresse','Pays','Expériences','Dispo 7/7','Autre travail','Autre contrat','Type contrat','Temps travail','Formation','Salaire','Document','Statut','Recto','Verso','Selfie'];
  const rows = allApps.map((a) => [formatDate(a.created_at), a.nom, a.email, a.adresse, a.pays, a.experiences, a.dispo7j, a.autreTravail, a.autreContrat, a.typeContrat, a.tempsTravail, a.formation, a.salaire, a.docType, statusLabels[a.status || 'nouveau'], a.doc_recto_url, a.doc_verso_url, a.selfie_url]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `candidatures-luxus-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
});
