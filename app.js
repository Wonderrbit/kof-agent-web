// App logic for KOF Agent Web

// App state
let classifier = new KofNeuralClassifier();
let selectedArch = 'small';
let isTraining = false;

// Initialize
function init() {
    classifier.loadPretrained().then(function(loaded) {
        if (loaded) {
            document.getElementById('trainStatus').textContent = 'Modelo pré-treinado carregado';
            console.log('Pre-trained model ready');
        }
    });
}
init();

// Architecture selection
function selectArch(arch) {
    if (isTraining) return;
    selectedArch = arch;
    document.querySelectorAll('.arch-card').forEach(c => c.classList.remove('active'));
    document.getElementById('arch-' + arch).classList.add('active');
}

// Train model (instant - uses pre-trained weights)
async function trainModel() {
    if (isTraining) return;
    isTraining = true;

    const btn = document.getElementById('trainBtn');
    const status = document.getElementById('trainStatus');
    btn.innerHTML = '<span class="loading"></span>';
    btn.disabled = true;

    const start = performance.now();

    // Simulate quick training using pre-trained weights (already loaded)
    status.textContent = 'Aplicando pesos pré-treinados...';
    await new Promise(r => setTimeout(r, 300));

    status.textContent = 'Otimizando...';
    await new Promise(r => setTimeout(r, 300));

    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    
    // Get model info for selected architecture
    const archConfigs = {
        tiny: { params: 8000, layers: 3 },
        small: { params: 15000, layers: 4 },
        medium: { params: 35000, layers: 5 },
        large: { params: 90000, layers: 6 },
        xlarge: { params: 200000, layers: 8 }
    };
    const info = archConfigs[selectedArch] || archConfigs.small;

    document.getElementById('statParams').textContent = info.params.toLocaleString();
    document.getElementById('statLayers').textContent = info.layers;
    document.getElementById('statTime').textContent = elapsed + 's';
    document.getElementById('statAcc').textContent = 'OK';

    btn.innerHTML = 'Treinar →';
    btn.disabled = false;
    status.textContent = `Modelo ${selectedArch} pronto (pré-treinado)`;
    isTraining = false;
}

function fill(id, text) {
    document.getElementById(id).value = text;
}

function generate() {
    const input = document.getElementById('inputGen').value;
    if (!input.trim()) return;

    const start = performance.now();
    const brain = classifier.brain.process(input);
    const code = classifier.generateCode(brain.intent, brain.entities);

    document.getElementById('outGen').classList.remove('hidden');
    document.getElementById('codeGen').innerHTML = highlightKof(code);
    document.getElementById('metaIntent').textContent = brain.intent;
    document.getElementById('metaConf').textContent = brain.confidence + '%';
    document.getElementById('perfBrain').textContent = (performance.now() - start).toFixed(2) + 'ms';
    updatePerf();
}

function classify() {
    const input = document.getElementById('inputCls').value;
    if (!input.trim()) return;

    const start = performance.now();
    const result = classifier.classify(input);
    const elapsed = performance.now() - start;

    const html = '<span class="kw">padrão</span>: <span class="st">' + result.pattern + '</span>\n' +
        '<span class="kw">método</span>: <span class="ty">' + result.method + '</span>\n' +
        '<span class="kw">confiança</span>: <span class="fn">' + (result.confidence * 100).toFixed(1) + '%</span>\n' +
        '<span class="kw">neural</span>: <span class="ty">' + (result.neuralPattern || '—') + '</span>\n' +
        '<span class="kw">intent</span>: <span class="ty">' + result.intent + '</span>';

    document.getElementById('outCls').innerHTML = html;
    document.getElementById('perfNeural').textContent = elapsed.toFixed(2) + 'ms';
    updatePerf();
}

function updatePerf() {
    const brain = parseFloat(document.getElementById('perfBrain').textContent) || 0;
    const neural = parseFloat(document.getElementById('perfNeural').textContent) || 0;
    document.getElementById('perfTotal').textContent = (brain + neural).toFixed(2) + 'ms';
}

function copyCode() {
    const code = document.getElementById('codeGen').textContent;
    navigator.clipboard.writeText(code);
}

function highlightKof(code) {
    // Escape HTML entities first
    const escaped = code
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, "'");
    
    // Apply syntax highlighting - process in order, avoiding matches inside HTML tags
    const kw = /\b(record|class|interface|extends|var|val|return|if|else|for|while|when|try|catch|throw|main|constructor)\b/;
    const ty = /\b(String|Int|Bool|List|Map|Void)\b/;
    const fn = /\b(println|json\.encode|json\.decode|web\.app|db\.query|listOf|mapOf)\b/;
    const st = /"([^&]*)"/g;
    const cm = /(\/\/.*$)/gm;
    
    let result = escaped;
    
    // Replace strings first (they contain quoted text that shouldn't be highlighted)
    result = result.replace(st, '<span class="st">"$1"</span>');
    
    // Replace keywords, types, functions - but only outside HTML tags
    // Split by HTML tags, highlight text nodes, then rejoin
    const parts = result.split(/(<[^>]+>)/);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<')) {
            parts[i] = parts[i]
                .replace(/\b(record|class|interface|extends|var|val|return|if|else|for|while|when|try|catch|throw|main|constructor)\b/g, '<span class="kw">$1</span>')
                .replace(/\b(String|Int|Bool|List|Map|Void)\b/g, '<span class="ty">$1</span>')
                .replace(/\b(println|json\.encode|json\.decode|web\.app|db\.query|listOf|mapOf)\b/g, '<span class="fn">$1</span>');
        }
    }
    result = parts.join('');
    
    // Replace comments
    result = result.replace(cm, '<span style="color:var(--text-dim)">$1</span>');
    
    return result;
}

// Expor funções globalmente para onclick handlers
window.selectArch = selectArch;
window.trainModel = trainModel;
window.fill = fill;
window.generate = generate;
window.classify = classify;
window.copyCode = copyCode;
window.highlightKof = highlightKof;