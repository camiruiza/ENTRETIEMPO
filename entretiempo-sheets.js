/**
 * ============================================================
 * ENTRETIEMPO — CONEXIÓN DIRECTA CON GOOGLE SHEETS
 * ============================================================
 * URL del Web App: configurada y lista
 * Spreadsheet ID: 13RA-o0RXC8rec71D7gHXYMQlvOg2panExCYcCGWkl1U
 * ============================================================
 */

const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbx6HiDSQLY7ys4NcRVMm-Rc_djHBVdcL6orozucGbpIcRq8O52n5AjJiKrDmCz_kotv/exec';
const SPREADSHEET_ID = '13RA-o0RXC8rec71D7gHXYMQlvOg2panExCYcCGWkl1U';

// ─── UTILIDADES ──────────────────────────────────────────────

async function enviarASheets(hoja, datos) {
  try {
    const response = await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoja, datos, timestamp: new Date().toISOString() }),
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { message: text }; }
    return { ok: true, data: result };
  } catch (error) {
    console.error('[Entretiempo] Error:', error);
    return { ok: false, error: error.message };
  }
}

function mostrarFeedback(containerId, success, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const bg    = success ? '#EAF0E0' : '#FDECEA';
  const color = success ? '#6B7D50' : '#C0392B';
  const icon  = success ? '✓' : '⚠';
  container.innerHTML = `
    <div style="background:${bg};border-radius:10px;padding:12px 16px;
      font-size:13px;color:${color};display:flex;align-items:center;
      gap:10px;line-height:1.5;margin-top:10px;">
      <span style="font-size:16px;">${icon}</span>
      <span>${message}</span>
    </div>`;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setLoading(btnId, loading, originalText = 'Enviar') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled      = loading;
  btn.style.opacity = loading ? '0.7' : '1';
  btn.textContent   = loading ? 'Enviando...' : originalText;
}

function generarID() {
  return 'ET-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ─── 1. REGISTRO DE PACIENTE ──────────────────────────────────
async function registrarPaciente(datos) {
  setLoading('btn-registro', true, 'Enviar solicitud');

  const fila = [
    generarID(),
    datos.nombre        || '',
    datos.apellido      || '',
    datos.email         || '',
    datos.telefono      || '',
    datos.pais          || '',
    (datos.motivosConsulta || []).join(', '),
    datos.modalidad     || 'Sin preferencia',
    datos.primeraVez === 'si' ? 'Sí' : 'No',
    (datos.horarios || []).join(', '),
    'Pendiente asignación',
    '',
    datos.refNombre     || '',
    datos.refVinculo    || '',
    datos.refTelefono   || '',
    new Date().toLocaleDateString('es-AR'),
  ];

  const result = await enviarASheets('Pacientes', fila);
  setLoading('btn-registro', false, 'Enviar solicitud');

  if (result.ok) {
    mostrarFeedback('feedback-registro', true,
      '¡Recibimos tu solicitud! Un coordinador te contactará en las próximas 24 hs.'
    );
    if (typeof goStep === 'function') goStep(4);
  } else {
    mostrarFeedback('feedback-registro', false,
      'Hubo un problema. Por favor intentalo de nuevo o escribinos a info@entretiempo.psi'
    );
  }
  return result;
}

// ─── 2. POSTULACIÓN DE PSICÓLOGO ─────────────────────────────
async function postularPsicologo(datos) {
  setLoading('btn-postulacion', true, 'Enviar postulación');

  const fila = [
    generarID(),
    datos.nombre            || '',
    datos.apellido          || '',
    datos.email             || '',
    datos.telefono          || '',
    datos.pais              || '',
    datos.ciudad            || '',
    datos.matricula         || '',
    datos.corriente         || '',
    datos.anosExperiencia   || 0,
    datos.modalidad         || '',
    (datos.areas || []).join(', '),
    datos.motivacion        || '',
    datos.comoNosConocio    || '',
    'Nueva postulación',
    new Date().toLocaleDateString('es-AR'),
  ];

  const result = await enviarASheets('Postulaciones', fila);
  setLoading('btn-postulacion', false, 'Enviar postulación');

  if (result.ok) {
    const formContent   = document.getElementById('form-content');
    const successScreen = document.getElementById('success-screen');
    if (formContent)   formContent.style.display   = 'none';
    if (successScreen) successScreen.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    mostrarFeedback('feedback-postulacion', false,
      'Hubo un problema. Por favor intentalo de nuevo o escribinos a info@entretiempo.psi'
    );
  }
  return result;
}

// ─── 3. ASIGNACIÓN DE PACIENTE ────────────────────────────────
async function asignarPaciente(datos) {
  setLoading('modal-confirm-btn', true, 'Confirmar asignación');

  const fila = [
    generarID(),
    datos.nombrePaciente  || '',
    datos.nombrePsicologo || '',
    new Date().toLocaleDateString('es-AR'),
    'Online',
    'Asignado',
    1,
    45,
    datos.notaCoordinador || '',
    new Date().toLocaleDateString('es-AR'),
  ];

  const result = await enviarASheets('Sesiones', fila);
  setLoading('modal-confirm-btn', false, 'Confirmar asignación');

  if (result.ok) {
    if (typeof showToast  === 'function') showToast('Asignación guardada correctamente en Google Sheets.');
    if (typeof closeModal === 'function') closeModal();
  } else {
    if (typeof showToast === 'function') showToast('Error al guardar. Intentá nuevamente.');
  }
  return result;
}

// ─── RECOLECTORES DE DATOS ────────────────────────────────────
function recolectarDatosRegistro() {
  const nombre = document.getElementById('nombre')?.value?.trim();
  const email  = document.getElementById('email')?.value?.trim();
  if (!nombre || !email) {
    mostrarFeedback('feedback-registro', false, 'Completá tu nombre y email antes de continuar.');
    return null;
  }
  const chips = Array.from(document.querySelectorAll('.chip.sel, .chip.selected')).map(el => el.textContent.trim());
  return {
    nombre,
    apellido:        document.getElementById('apellido')?.value?.trim() || '',
    email,
    telefono:        document.getElementById('tel')?.value?.trim() || '',
    pais:            document.getElementById('pais')?.value || '',
    motivosConsulta: chips,
    modalidad:       document.querySelector('.option-card.selected h4')?.textContent || 'Sin preferencia',
    primeraVez:      'no',
    horarios:        [],
    refNombre:       document.getElementById('ref-nombre')?.value?.trim() || '',
    refVinculo:      document.getElementById('ref-vinculo')?.value || '',
    refTelefono:     document.getElementById('ref-tel')?.value?.trim() || '',
  };
}

function recolectarDatosPostulacion() {
  const nombre    = document.querySelector('input[placeholder*="nombre" i]')?.value?.trim();
  const email     = document.querySelector('input[type="email"]')?.value?.trim();
  const matricula = document.querySelector('input[placeholder*="atrícula" i], input[placeholder*="12345"]')?.value?.trim();
  if (!nombre || !email || !matricula) {
    mostrarFeedback('feedback-postulacion', false, 'Completá nombre, email y matrícula.');
    return null;
  }
  const areas = Array.from(document.querySelectorAll('.chip.sel')).map(el => el.textContent.trim());
  return {
    nombre, email, matricula,
    apellido:        document.querySelectorAll('input[type="text"]')[1]?.value?.trim() || '',
    telefono:        document.querySelector('input[type="tel"]')?.value?.trim() || '',
    pais:            document.querySelectorAll('select')[1]?.value || '',
    ciudad:          document.querySelectorAll('input[type="text"]')[3]?.value?.trim() || '',
    corriente:       document.querySelectorAll('select')[0]?.value || '',
    anosExperiencia: parseInt(document.querySelector('input[type="number"]')?.value) || 0,
    modalidad:       document.querySelectorAll('select')[2]?.value || '',
    areas,
    motivacion:      document.querySelector('textarea')?.value?.trim() || '',
    comoNosConocio:  document.querySelectorAll('select')[3]?.value || '',
  };
}

function recolectarDatosAsignacion() {
  const nombrePaciente  = document.getElementById('mod-nombre')?.textContent || '';
  const psicoSelect     = document.querySelector('.modal select');
  const nombrePsicologo = psicoSelect?.options[psicoSelect.selectedIndex]?.text || '';
  const nota            = document.querySelector('.modal textarea')?.value?.trim() || '';
  return { nombrePaciente, nombrePsicologo, notaCoordinador: nota };
}

// ─── INTEGRACIÓN AUTOMÁTICA ───────────────────────────────────
(function autoIntegrar() {
  const path = window.location.pathname;

  if (path.includes('registro')) {
    window.addEventListener('load', () => {
      const btn = document.getElementById('btn-registro');
      if (btn) btn.onclick = async (e) => {
        e.preventDefault();
        const datos = recolectarDatosRegistro();
        if (datos) await registrarPaciente(datos);
      };
      if (!document.getElementById('feedback-registro')) {
        const div = document.createElement('div');
        div.id = 'feedback-registro';
        document.getElementById('btn-registro')?.parentNode.insertBefore(div, document.getElementById('btn-registro'));
      }
    });
  }

  if (path.includes('unete')) {
    window.addEventListener('load', () => {
      const btn = document.querySelector('button.submit-btn');
      if (btn) {
        btn.id = 'btn-postulacion';
        btn.onclick = async (e) => {
          e.preventDefault();
          const datos = recolectarDatosPostulacion();
          if (datos) await postularPsicologo(datos);
        };
      }
      if (!document.getElementById('feedback-postulacion')) {
        const div = document.createElement('div');
        div.id = 'feedback-postulacion';
        document.querySelector('.form-card')?.appendChild(div);
      }
    });
  }

  if (path.includes('coordinador')) {
    window.confirmModalOriginal = window.confirmModal;
    window.confirmModal = async function() {
      if (window.currentModal === 'asignar-pac' || window.currentModal === 'asignar') {
        const datos = recolectarDatosAsignacion();
        if (datos) await asignarPaciente(datos);
      } else {
        if (window.confirmModalOriginal) window.confirmModalOriginal();
      }
    };
  }
})();

window.EntretiempoSheets = { registrarPaciente, postularPsicologo, asignarPaciente };
console.log('[Entretiempo] ✓ Módulo Google Sheets listo. Webhook configurado.');
