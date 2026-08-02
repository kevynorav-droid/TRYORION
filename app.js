const GROQ_API_KEY = "GET-API"; // Reemplaza aquí con tu API Key segura cuando la uses

const smallLogo = document.getElementById('smallLogo');
const form = document.getElementById('orionForm');
const input = document.getElementById('q');
const resultadosDiv = document.getElementById('resultados');
const home = document.getElementById('home');
const menuBtn = document.getElementById('menuBtn');
const menuPanel = document.getElementById('menuPanel');
const aiEngineSelect = document.getElementById('aiEngineSelect');
const langSelect = document.getElementById('langSelect');
const fontSelect = document.getElementById('fontSelect');
const darkToggle = document.getElementById('darkToggle');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// --- RESTAURAR AJUSTES GUARDADOS ---
if (localStorage.getItem('orion_dark') === 'true') {
  document.body.classList.add('dark');
  if (darkToggle) darkToggle.checked = true;
}
if (localStorage.getItem('orion_font')) {
  document.body.style.fontSize = localStorage.getItem('orion_font');
  if (fontSelect) fontSelect.value = localStorage.getItem('orion_font');
}
if (localStorage.getItem('orion_lang')) {
  if (langSelect) langSelect.value = localStorage.getItem('orion_lang');
}

// Función global para regresar a la pantalla de inicio
window.volverAlInicio = function() {
  home.classList.remove('hidden');
  resultadosDiv.classList.add('hidden');
  resultadosDiv.innerHTML = "";
  input.value = '';
};

if (smallLogo) smallLogo.addEventListener('click', volverAlInicio);

// --- CONTROL DEL MENÚ FLOTANTE ---
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  menuPanel.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!menuPanel.contains(e.target) && e.target !== menuBtn) {
    menuPanel.classList.add('hidden');
  }
});

// --- AJUSTES DEL MENÚ ---
darkToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark', darkToggle.checked);
  localStorage.setItem('orion_dark', darkToggle.checked);
});

fontSelect.addEventListener('change', () => {
  document.body.style.fontSize = fontSelect.value;
  localStorage.setItem('orion_font', fontSelect.value);
});

langSelect.addEventListener('change', () => {
  localStorage.setItem('orion_lang', langSelect.value);
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.clear();
  alert('Historial borrado con éxito.');
  location.reload();
});

// --- VALIDADOR ESTRICTO DE MATEMÁTICAS ---
function esMatematica(q) {
  q = q.toLowerCase();
  const palabrasClave = ["suma","resta","multiplica","divide","cuanto es","cuánto es","resuelve","calcula","porcentaje","raiz","raíz","potencia","ecuacion","ecuación","integral","derivada","seno","coseno","matematicas","matemáticas","numero","número"];
  const tienePalabra = palabrasClave.some(p => q.includes(p));
  const tieneNumero = /\d/.test(q);
  const tieneSimbolo = /[\+\-\*\/\=\%\(\)\^]/.test(q);
  return tienePalabra || (tieneNumero && tieneSimbolo) || (tieneNumero && q.length < 20);
}

// --- PETICIÓN A GROQ AI ---
async function preguntarOrionAI(texto, esModoMaths = false) {
  try {
    const systemPrompt = esModoMaths 
      ? "Eres el módulo de Matemáticas de ORION. Eres estrictamente preciso, directo y resuelves operaciones y problemas matemáticos paso a paso de forma clara, fría y analítica. No uses emojis ni hables de otros temas."
      : "Eres ORION AI, eres un asistente súper amigable, buena onda, hablas como un amigo mexicano de 20 años pero respetuoso. SIEMPRE respondes en español. Usas emojis de vez en cuando. Respondes de forma útil, divertida y clara, no como Wikipedia aburrida.";

    const res = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: texto }
        ]
      })
    });
    
    const data = await res.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      return "⚠️ Servidor ORION AI listo. Módulo en espera de activación por API Key.";
    }
  } catch (err) {
    return "❌ Error en la conexión con ORION AI: Módulo desconectado temporalmente.";
  }
}

// --- FUNCIÓN PARA LEER EL ARTÍCULO COMPLETO DE WIKIPEDIA DENTRO DE LA APP ---
window.verArticuloCompleto = async function(title, lang, imgUrl) {
  resultadosDiv.innerHTML = `<p class="loading-text">Abriendo el artículo <b>${title}</b>...</p>`;
  try {
    // Pedimos el extracto de texto completo y limpio del artículo
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=0&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const textoCompleto = pages[pageId].extract || "No se pudo recuperar el cuerpo del texto.";

    let headerImagen = imgUrl && imgUrl !== 'null' 
      ? `<img src="${imgUrl}" class="article-img" style="max-width:100%; height:auto; max-height:400px; object-fit:contain; margin-bottom:20px; border-radius:12px; border:1px solid var(--border-color);">` 
      : '';

    resultadosDiv.innerHTML = `
      <button class="btn-volver" onclick="volverAlInicio()">← Volver al buscador</button>
      <h2 style="margin-top:15px; margin-bottom:15px; font-size:26px;">${title}</h2>
      ${headerImagen}
      <div class="article-text" style="font-size:16px; line-height:1.7; text-align:justify; white-space:pre-wrap;">${textoCompleto}</div>
      <a href="https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}" target="_blank" class="wiki-link" style="display:inline-block; margin-top:25px;">Leer artículo original en Wikipedia externa →</a>
    `;
  } catch (err) {
    resultadosDiv.innerHTML = `
      <button class="btn-volver" onclick="volverAlInicio()">← Volver</button>
      <p style="margin-top:15px; color:#ff4d4d;">Error al abrir el texto completo: ${err}</p>
    `;
  }
};

// --- PROCESAMIENTO DEL BUSCADOR ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;

  const engine = aiEngineSelect.value;
  const lang = langSelect.value || 'es';
  
  home.classList.add('hidden');
  resultadosDiv.classList.remove('hidden');
  resultadosDiv.innerHTML = `<p class="loading-text">Buscando <b>${q}</b>...</p>`;

  // === MOTOR: ORION AI O MATHS ===
  if (engine === 'orionai' || engine === 'maths') {
    if (engine === 'maths' && !esMatematica(q)) {
      resultadosDiv.innerHTML = `
        <button class="btn-volver" onclick="volverAlInicio()">← Volver</button>
        <div style="margin-top:20px; padding:20px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; text-align:center">
          <h2 style="color:#ff4d4d; margin-bottom:10px;">ERROR: CONTROL MATEMÁTICO</h2>
          <p style="margin-bottom:10px;">Por favor, introduce una consulta numérica o matemática válida como "cuánto es 25*30" o "raíz de 144".</p>
          <p style="font-size:14px; opacity:0.7;">Si deseas buscar información general, cambia el motor de búsqueda a <b>ORION AI</b> en la barra superior.</p>
        </div>
      `;
      return;
    }

    resultadosDiv.innerHTML = `<p class="loading-text">ORION procesando tu consulta sobre <b>${q}</b>...</p>`;
    const respuesta = await preguntarOrionAI(q, engine === 'maths');
    let fotosHtml = '';

    const esNumero = /^\d+[\s\d\-\+\*\/\.]*$/.test(q);
    if (engine === 'orionai' && !esNumero) {
      try {
        const urlWikiImages = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&prop=pageimages&format=json&pithumbsize=400&origin=*`;
        const r = await fetch(urlWikiImages);
        const dataWiki = await r.json();
        
        if (dataWiki.query && dataWiki.query.pages) {
          const urls = Object.values(dataWiki.query.pages).map(p => p.thumbnail?.source).filter(Boolean);
          if (urls.length > 0) {
            fotosHtml = `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:12px; margin-top:20px;">${urls.map(s => `<img src="${s}" style="width:100%; height:130px; object-fit:cover; border-radius:12px; border:1px solid var(--border-color);">`).join('')}</div>`;
          }
        }
      } catch (e) {
        console.error("Error al recuperar imágenes ilustrativas:", e);
      }
    }

    resultadosDiv.innerHTML = `
      <button class="btn-volver" onclick="volverAlInicio()">← Volver</button>
      <div style="white-space:pre-wrap; line-height:1.6; margin-top:15px; font-size:16px;">${respuesta}</div>
      ${fotosHtml}
    `;
    return;
  }

  // === MOTOR: WIKIPEDIA (OPTIMIZADO CON FOTOS Y LECTURA INTERNA) ===
  if (engine === 'wikipedia') {
    try {
      // Usamos generator=search junto con prop=pageimages y extracts para traer todo limpio de un solo golpe
      const urlCompleta = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=10&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=500&pilimit=max&exintro=1&explaintext=1&exsentences=2&exlimit=max&format=json&origin=*`;
      
      const resp = await fetch(urlCompleta);
      const d = await resp.json();
      
      if (!d.query || !d.query.pages) {
        resultadosDiv.innerHTML = `
          <button class="btn-volver" onclick="volverAlInicio()">← Volver</button>
          <p style="margin-top:15px; text-align:center;">No se encontraron resultados en Wikipedia para tu búsqueda.</p>
        `;
        return;
      }

      // 1. Limpiamos el contenedor e inyectamos el botón de volver y el encabezado inicial
      resultadosDiv.innerHTML = `
        <button class="btn-volver" onclick="volverAlInicio()">← Volver</button>
        <h3 style="margin-top:15px; margin-bottom:20px;">Resultados para "${q}":</h3>
      `;

      const paginas = Object.values(d.query.pages);
      
      // 2. Creamos cada tarjeta de forma segura usando el DOM
      paginas.forEach(item => {
        const fotoUrl = item.thumbnail ? item.thumbnail.source : null;
        const textoLimpio = item.extract ? item.extract : "Sin resumen disponible.";
        
        // Creamos la etiqueta de artículo
        const tarjeta = document.createElement('article');
        tarjeta.className = 'result-item';
        tarjeta.style.cssText = 'display:flex; gap:16px; margin-bottom:20px; align-items:flex-start; background:var(--bg-card); padding:14px; border-radius:12px; border:1px solid var(--border-color);';

        // Insertamos la estructura interna de texto e imagen sin eventos inline
        tarjeta.innerHTML = `
          ${fotoUrl ? `<img src="${fotoUrl}" class="result-thumb" style="width:90px; height:90px; object-fit:cover; border-radius:8px; flex-shrink:0;">` : ''}
          <div class="result-body" style="flex:1;">
            <a href="#" class="enlace-articulo" style="font-weight:bold; font-size:18px; color:var(--link-color); text-decoration:none; display:block; margin-bottom:6px;">${item.title}</a>
            <p style="color:var(--text-secondary); font-size:14px; line-height:1.5; margin:0;">${textoLimpio}</p>
          </div>
        `;

        // 3. CAPTURA SEGURA: Buscamos el enlace interno de la tarjeta y le asignamos el evento click nativo
        const enlace = tarjeta.querySelector('.enlace-articulo');
        enlace.addEventListener('click', (e) => {
          e.preventDefault();
          window.verArticuloCompleto(item.title, lang, fotoUrl);
        });

        // Agregamos la tarjeta terminada al contenedor de resultados
        resultadosDiv.appendChild(tarjeta);
      });
      
    } catch (err) {
      resultadosDiv.innerHTML = `
        <button class="btn-volver" onclick="volverAlInicio()">← Volver</button>
        <p style="margin-top:15px; color:#ff4d4d;">Error al conectar con Wikipedia: ${err}</p>
      `;
    }
  }
}); // Aquí cierra por completo el formulario
