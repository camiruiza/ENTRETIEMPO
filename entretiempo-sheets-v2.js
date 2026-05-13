/**
 * ============================================================
 * ENTRETIEMPO — MÓDULO DE CONEXIÓN CON AIRTABLE VIA MAKE
 * ============================================================
 * 
 * INSTRUCCIONES DE USO:
 * 1. Crear cuenta en make.com (gratis)
 * 2. Crear 3 escenarios (uno por formulario)
 * 3. En cada escenario: Módulo 1 = Webhook, Módulo 2 = Airtable
 * 4. Reemplazar los WEBHOOK_URL de abajo con los de Make
 * 5. Incluir este script en las páginas correspondientes:
 *    <script src="entretiempo-airtable.js"></script>
 * ============================================================
 */

// ─── CONFIGURACIÓN ───────────────────────────────────────────
// Reemplazá estos URLs con los webhooks reales de Make
const WEBHOOKS = {
  pacientes:     'https://hook.eu1.make.com/REEMPLAZAR_PACIENTES',
  psicologos:    'https://hook.eu1.make.com/REEMPLAZAR_PSICOLOGOS',
  asignaciones:  'https://hook.eu1.make.com/REEMPLAZAR_ASIGNACIONES',
};

// ─── UTILIDADES ──────────────────────────────────────────────

/**
 * Envía datos a Make via webhook con manejo de errores
 * @param {string} webhook - URL del webhook de Make
 * @param {object} data - Datos a enviar
 * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
 */
async function enviarAMake(webhook, data) {
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        origen: window.location.href,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    // Make puede devolver JSON o texto plano según la configuración
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { message: text }; }

    return { ok: true, data: result };
  } catch (error) {
    console.error('[Entretiempo] Error al enviar a Make:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Muestra un mensaje de éxito o error en el formulario
 * @param {string} containerId - ID del contenedor donde mostrar el mensaje
 * @param {boolean} success - true = éxito, false = error
 * @param {string} message - Mensaje a mostrar
 */
function mostrarFeedback(containerId, success, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const bg    = success ? '#EAF0E0' : '#FDECEA';
  const color = success ? '#6B7D50' : '#C0392B';
  const icon  = success ? '✓' : '⚠';

  container.innerHTML = `
    <div style="
      background:${bg};border-radius:10px;padding:12px 16px;
      font-size:13px;color:${color};display:flex;
      align-items:center;gap:10px;line-height:1.5;
    ">
      <span style="font-size:16px;flex-shrink:0;">${icon}</span>
      <span>${message}</span>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Deshabilita/habilita un botón con estado de carga
 * @param {string} btnId - ID del botón
 * @param {boolean} loading - true = cargando, false = listo
 * @param {string} originalText - Texto original del botón
 */
function setLoading(btnId, loading, originalText = 'Enviar') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.7' : '1';
  btn.style.cursor  = loading ? 'wait' : 'pointer';
  btn.textContent   = loading ? 'Enviando...' : originalText;
}

// ─── 1. REGISTRO DE PACIENTE ──────────────────────────────────
/**
 * Conecta con la página entretiempo-registro.html
 * Llama a esta función al enviar el formulario del paso 3
 * 
 * CÓMO INTEGRAR EN entretiempo-registro.html:
 * Reemplazá la función doRegister() existente por esta.
 */
async function registrarPaciente(datos) {
  /**
   * @param {object} datos - Campos del formulario
   * @param {string} datos.nombre        - Nombre del paciente
   * @param {string} datos.apellido      - Apellido
   * @param {string} datos.email         - Email
   * @param {string} datos.telefono      - Teléfono/WhatsApp (opcional)
   * @param {string} datos.pais          - País seleccionado
   * @param {string} datos.comoNosConocio - Cómo nos conoció
   * @param {string[]} datos.motivosConsulta - Array de motivos seleccionados
   * @param {string} datos.descripcionLibre - Texto libre (opcional)
   * @param {string} datos.primeraVez    - "si" o "no"
   * @param {string} datos.modalidad     - "Online" | "Presencial" | "Sin preferencia"
   * @param {string} datos.frecuencia    - "Semanal" | "Quincenal"
   * @param {string[]} datos.horarios    - Array de franjas horarias
   * @param {string} datos.generoPreferido - Preferencia de género del psicólogo
   * @param {string} datos.corriente     - Corriente psicológica preferida
   * @param {string} datos.refNombre     - Nombre del contacto de referencia (opcional)
   * @param {string} datos.refVinculo    - Vínculo del contacto de referencia (opcional)
   * @param {string} datos.refTelefono   - Teléfono del contacto de referencia (opcional)
   */

  setLoading('btn-registro', true, 'Enviar solicitud');

  const payload = {
    tipo: 'registro_paciente',
    // Datos personales
    nombre:         datos.nombre,
    apellido:       datos.apellido,
    email:          datos.email,
    telefono:       datos.telefono || '',
    pais:           datos.pais || '',
    como_nos_conocio: datos.comoNosConocio || '',
    // Consulta
    motivos:        (datos.motivosConsulta || []).join(', '),
    descripcion:    datos.descripcionLibre || '',
    primera_vez:    datos.primeraVez === 'si' ? 'Sí' : 'Ya hizo terapia',
    // Preferencias
    modalidad:      datos.modalidad || 'Sin preferencia',
    frecuencia:     datos.frecuencia || 'Semanal',
    horarios:       (datos.horarios || []).join(', '),
    genero_psicologo: datos.generoPreferido || 'Sin preferencia',
    corriente:      datos.corriente || 'Sin preferencia',
    // Referencia
    ref_nombre:     datos.refNombre || '',
    ref_vinculo:    datos.refVinculo || '',
    ref_telefono:   datos.refTelefono || '',
    // Estado inicial
    estado:         'Pendiente asignación',
  };

  const result = await enviarAMake(WEBHOOKS.pacientes, payload);

  setLoading('btn-registro', false, 'Enviar solicitud');

  if (result.ok) {
    mostrarFeedback('feedback-registro', true,
      '¡Recibimos tu solicitud! Un coordinador te asignará un psicólogo en las próximas 24 hs.'
    );
    // Avanzar al paso de confirmación del formulario
    if (typeof goStep === 'function') goStep(4);
  } else {
    mostrarFeedback('feedback-registro', false,
      'Hubo un problema al enviar tu solicitud. Por favor intentalo de nuevo o escribinos a info@entretiempo.psi'
    );
  }

  return result;
}


// ─── 2. POSTULACIÓN DE PSICÓLOGO ─────────────────────────────
/**
 * Conecta con la página entretiempo-unete.html
 * Llama a esta función al enviar el formulario de postulación
 *
 * CÓMO INTEGRAR EN entretiempo-unete.html:
 * Reemplazá la función submitForm() existente por esta.
 */
async function postularPsicologo(datos) {
  /**
   * @param {object} datos
   * @param {string} datos.nombre         - Nombre del profesional
   * @param {string} datos.apellido       - Apellido
   * @param {string} datos.email          - Email profesional
   * @param {string} datos.telefono       - WhatsApp/teléfono
   * @param {string} datos.pais           - País de residencia
   * @param {string} datos.ciudad         - Ciudad
   * @param {string} datos.matricula      - Número de matrícula
   * @param {string} datos.corriente      - Corriente psicológica
   * @param {number} datos.anosExperiencia - Años de experiencia
   * @param {string} datos.modalidad      - Modalidad de atención
   * @param {string[]} datos.areas        - Áreas de especialización
   * @param {string} datos.motivacion     - Por qué quiere sumarse
   * @param {string} datos.comoNosConocio - Cómo nos conoció
   */

  setLoading('btn-postulacion', true, 'Enviar postulación');

  const payload = {
    tipo: 'postulacion_psicologo',
    // Datos personales
    nombre:          datos.nombre,
    apellido:        datos.apellido,
    email:           datos.email,
    telefono:        datos.telefono || '',
    pais:            datos.pais || '',
    ciudad:          datos.ciudad || '',
    // Datos profesionales
    matricula:       datos.matricula,
    corriente:       datos.corriente,
    anos_experiencia: datos.anosExperiencia || 0,
    modalidad:       datos.modalidad || '',
    areas:           (datos.areas || []).join(', '),
    // Postulación
    motivacion:      datos.motivacion || '',
    como_nos_conocio: datos.comoNosConocio || '',
    // Estado inicial
    estado:          'Nueva postulación',
  };

  const result = await enviarAMake(WEBHOOKS.psicologos, payload);

  setLoading('btn-postulacion', false, 'Enviar postulación');

  if (result.ok) {
    // Ocultar el formulario y mostrar pantalla de éxito
    const formContent = document.getElementById('form-content');
    const successScreen = document.getElementById('success-screen');
    if (formContent) formContent.style.display = 'none';
    if (successScreen) successScreen.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    mostrarFeedback('feedback-postulacion', false,
      'Hubo un problema al enviar tu postulación. Por favor intentalo de nuevo o escribinos a info@entretiempo.psi'
    );
  }

  return result;
}


// ─── 3. ASIGNACIÓN DE PACIENTE (COORDINADOR) ─────────────────
/**
 * Conecta con el panel del coordinador entretiempo-coordinador.html
 * Llama a esta función al confirmar una asignación en el modal
 *
 * CÓMO INTEGRAR EN entretiempo-coordinador.html:
 * Reemplazá la función confirmModal() existente por esta.
 */
async function asignarPaciente(datos) {
  /**
   * @param {object} datos
   * @param {string} datos.nombrePaciente   - Nombre del paciente
   * @param {string} datos.emailPaciente    - Email del paciente (para notificar)
   * @param {string} datos.nombrePsicologo  - Nombre del psicólogo asignado
   * @param {string} datos.emailPsicologo   - Email del psicólogo (para notificar)
   * @param {string} datos.notaCoordinador  - Nota interna del coordinador
   * @param {string} datos.modalidad        - Modalidad de la asignación
   */

  setLoading('modal-confirm-btn', true, 'Confirmar asignación');

  const payload = {
    tipo: 'asignacion_paciente',
    // Paciente
    nombre_paciente:  datos.nombrePaciente,
    email_paciente:   datos.emailPaciente || '',
    // Psicólogo
    nombre_psicologo: datos.nombrePsicologo,
    email_psicologo:  datos.emailPsicologo || '',
    // Asignación
    nota_coordinador: datos.notaCoordinador || '',
    modalidad:        datos.modalidad || 'Online',
    // Estado
    estado:           'Asignado',
    fecha_asignacion: new Date().toISOString(),
  };

  const result = await enviarAMake(WEBHOOKS.asignaciones, payload);

  setLoading('modal-confirm-btn', false, 'Confirmar asignación');

  if (result.ok) {
    // Mostrar toast de éxito en el panel del coordinador
    if (typeof showToast === 'function') {
      showToast('Asignación realizada. Se notificó al psicólogo y al paciente.');
    }
    // Cerrar el modal
    if (typeof closeModal === 'function') closeModal();
  } else {
    if (typeof showToast === 'function') {
      showToast('Error al guardar la asignación. Intentá nuevamente.');
    }
  }

  return result;
}


// ─── INTEGRACIÓN AUTOMÁTICA ───────────────────────────────────
/**
 * Esta función detecta en qué página estamos y conecta
 * automáticamente los formularios al cargar el script.
 * 
 * Incluí el script en TODAS las páginas y se configura solo:
 * <script src="entretiempo-airtable.js"></script>
 */
(function autoIntegrar() {
  const path = window.location.pathname;

  // Página de registro de paciente
  if (path.includes('registro')) {
    window.addEventListener('load', () => {
      // Override del botón de envío del paso 3
      const btnOriginal = document.getElementById('btn-registro');
      if (btnOriginal) {
        btnOriginal.onclick = async (e) => {
          e.preventDefault();
          const datos = recolectarDatosRegistro();
          if (datos) await registrarPaciente(datos);
        };
      }
      // Agregar contenedor de feedback si no existe
      if (!document.getElementById('feedback-registro')) {
        const div = document.createElement('div');
        div.id = 'feedback-registro';
        const btn = document.getElementById('btn-registro');
        if (btn) btn.parentNode.insertBefore(div, btn);
      }
    });
  }

  // Página de postulación de psicólogos
  if (path.includes('unete')) {
    window.addEventListener('load', () => {
      const btn = document.querySelector('[onclick*="submitForm"]') ||
                  document.querySelector('button[type="submit"]');
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
        const formCard = document.querySelector('.form-card');
        if (formCard) formCard.appendChild(div);
      }
    });
  }

  // Panel del coordinador
  if (path.includes('coordinador')) {
    // Override de confirmModal para guardar asignaciones en Airtable
    window.confirmModalOriginal = window.confirmModal;
    window.confirmModal = async function() {
      const datos = recolectarDatosAsignacion();
      if (datos && currentModal === 'asignar-pac') {
        await asignarPaciente(datos);
      } else {
        if (window.confirmModalOriginal) window.confirmModalOriginal();
      }
    };
  }
})();


// ─── RECOLECTORES DE DATOS ────────────────────────────────────
// Estas funciones leen los valores actuales de los formularios

function recolectarDatosRegistro() {
  const nombre  = document.getElementById('nombre')?.value?.trim();
  const apellido = document.getElementById('apellido')?.value?.trim();
  const email   = document.getElementById('email')?.value?.trim();

  if (!nombre || !email) {
    mostrarFeedback('feedback-registro', false,
      'Por favor completá tu nombre y email antes de continuar.'
    );
    return null;
  }

  // Recolectar chips seleccionados (motivos)
  const motivosEls = document.querySelectorAll('#chips-motivo .chip.selected, .chips .chip.sel');
  const motivos = Array.from(motivosEls).map(el => el.textContent.trim());

  // Recolectar franjas horarias seleccionadas
  const horariosEls = document.querySelectorAll('#chips-hora .chip.selected, .chips .chip.sel');
  const horarios = Array.from(horariosEls).map(el => el.textContent.trim());

  return {
    nombre,
    apellido:         document.getElementById('apellido')?.value?.trim() || '',
    email,
    telefono:         document.getElementById('tel')?.value?.trim() || '',
    pais:             document.getElementById('pais')?.value || '',
    comoNosConocio:   document.querySelector('select[id*="conocio"], select:last-of-type')?.value || '',
    motivosConsulta:  motivos,
    descripcionLibre: document.querySelector('textarea')?.value?.trim() || '',
    primeraVez:       document.querySelector('.option-card.selected')?.querySelector('h4')?.textContent?.includes('primera') ? 'si' : 'no',
    modalidad:        document.querySelector('.option-grid .option-card.selected h4')?.textContent || 'Sin preferencia',
    frecuencia:       'Semanal',
    horarios,
    generoPreferido:  document.querySelector('select[id*="genero"]')?.value || 'Sin preferencia',
    corriente:        document.querySelector('select[id*="corriente"]')?.value || 'Sin preferencia',
    refNombre:        document.getElementById('ref-nombre')?.value?.trim() || '',
    refVinculo:       document.getElementById('ref-vinculo')?.value || '',
    refTelefono:      document.getElementById('ref-tel')?.value?.trim() || '',
  };
}

function recolectarDatosPostulacion() {
  const nombre   = document.querySelector('input[placeholder*="nombre" i], input[placeholder*="Nombre" i]')?.value?.trim();
  const email    = document.querySelector('input[type="email"]')?.value?.trim();
  const matricula = document.querySelector('input[placeholder*="atrícula" i], input[placeholder*="12345"]')?.value?.trim();

  if (!nombre || !email || !matricula) {
    mostrarFeedback('feedback-postulacion', false,
      'Por favor completá nombre, email y matrícula antes de enviar.'
    );
    return null;
  }

  const areasEls = document.querySelectorAll('.chips .chip.sel');
  const areas = Array.from(areasEls).map(el => el.textContent.trim());

  const selects = document.querySelectorAll('select');
  const corriente  = selects[0]?.value || '';
  const pais       = selects[1]?.value || '';
  const modalidad  = selects[2]?.value || '';
  const comoConocio = selects[3]?.value || '';

  const inputs = document.querySelectorAll('input[type="text"], input[type="tel"]');

  return {
    nombre,
    apellido:        inputs[1]?.value?.trim() || '',
    email,
    telefono:        document.querySelector('input[type="tel"]')?.value?.trim() || '',
    pais,
    ciudad:          inputs[3]?.value?.trim() || '',
    matricula,
    corriente,
    anosExperiencia: parseInt(document.querySelector('input[type="number"]')?.value) || 0,
    modalidad,
    areas,
    motivacion:      document.querySelector('textarea')?.value?.trim() || '',
    comoNosConocio:  comoConocio,
  };
}

function recolectarDatosAsignacion() {
  const nombrePaciente  = document.getElementById('modal-paciente-nombre')?.textContent ||
                          document.getElementById('mod-nombre')?.textContent || '';
  const psicoSelect     = document.querySelector('#modal-select, .modal select');
  const nombrePsicologo = psicoSelect?.options[psicoSelect.selectedIndex]?.text || '';
  const nota            = document.querySelector('.modal textarea')?.value?.trim() || '';

  return {
    nombrePaciente,
    emailPaciente:   '',
    nombrePsicologo,
    emailPsicologo:  '',
    notaCoordinador: nota,
    modalidad:       'Online',
  };
}


// ─── EXPORT PARA USO MANUAL ───────────────────────────────────
// Podés llamar estas funciones directamente desde la consola para probar:
// registrarPaciente({nombre:'Test', email:'test@test.com', ...})
// postularPsicologo({nombre:'Lic. Test', email:'lic@test.com', matricula:'MP 99999', ...})
// asignarPaciente({nombrePaciente:'Ana M.', nombrePsicologo:'Lic. González', ...})

window.EntretiempoAirtable = {
  registrarPaciente,
  postularPsicologo,
  asignarPaciente,
  WEBHOOKS,
};

console.log('[Entretiempo] Módulo Airtable cargado correctamente.');
console.log('[Entretiempo] Recordá configurar los WEBHOOKS de Make en la línea 19.');
