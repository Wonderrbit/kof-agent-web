/**
 * KOF Agent - Brain Web Worker
 * 
 * Rule-based intent analysis running in parallel thread
 * Translated from 68_brain.kf → optimized for browser
 */

const INTENT_MAP = {
    'criar': 'create', 'crie': 'create', 'cria': 'create', 'fazer': 'create', 'faz': 'create',
    'gerar': 'create', 'gere': 'create', 'gera': 'create',
    'editar': 'edit', 'edite': 'edit', 'edita': 'edit', 'mudar': 'edit', 'mude': 'edit',
    'alterar': 'edit', 'altere': 'edit',
    'consertar': 'repair', 'conserta': 'repair', 'arrumar': 'repair', 'arruma': 'repair',
    'corrigir': 'repair', 'corrija': 'repair',
    'explicar': 'explain', 'explique': 'explain',
    'refatorar': 'refactor', 'refatore': 'refactor',
    'buscar': 'search', 'busque': 'search', 'procurar': 'search', 'procure': 'search',
    'rodar': 'runtests', 'rode': 'runtests', 'testar': 'runtests', 'teste': 'runtests', 'executar': 'runtests'
};

const OBJECT_PATTERNS = {
    'site': 'Website', 'website': 'Website', 'página': 'Website', 'pagina': 'Website',
    'crud': 'CRUD',
    'api': 'API',
    'rpa': 'RPA',
    'ui': 'UI', 'tela': 'UI', 'interface': 'UI',
    'docs': 'Docs', 'documentação': 'Docs', 'documentacao': 'Docs',
    'teste': 'Tests', 'testes': 'Tests',
    'erro': 'Diagnostic', 'diagnostico': 'Diagnostic',
    'símbolo': 'Symbol', 'função': 'Symbol', 'classe': 'Symbol', 'symbol': 'Symbol'
};

const INTENT_OBJECT_MAP = {
    'Website+create': 'CreateWebsite',
    'Website+edit': 'EditWebsite',
    'API+create': 'CreateAPI',
    'API+edit': 'CreateAPI',
    'CRUD+create': 'GenerateCRUD',
    'CRUD+edit': 'GenerateCRUD',
    'Diagnostic+repair': 'RepairDiagnostic',
    'Diagnostic+explain': 'ExplainDiagnostic',
    'Tests+runtests': 'RunTests',
    'UI+create': 'CreateUI',
    'Docs+generate': 'GenerateDocs',
    'RPA+create': 'CreateRPA',
    'Symbol+search': 'SearchSymbol'
};

const VERB_INTENTS = {
    'create': 'CreateFeature',
    'edit': 'EditFeature',
    'repair': 'RepairGeneric',
    'search': 'SearchGeneric',
    'runtests': 'RunTests',
    'explain': 'ExplainDiagnostic',
    'refactor': 'Refactor'
};

function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^\w\sáàâãéèêíïóôõúüç]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);
}

function resolveIntent(tokens) {
    let verb = '';
    let obj = '';

    for (const token of tokens) {
        if (INTENT_MAP[token] && !verb) {
            verb = INTENT_MAP[token];
        }
    }

    const joined = tokens.join(' ');
    for (const [pattern, objectType] of Object.entries(OBJECT_PATTERNS)) {
        if (joined.includes(pattern)) {
            obj = objectType;
            break;
        }
    }

    if (!verb) return 'Unknown';

    const key = `${obj}+${verb}`;
    if (INTENT_OBJECT_MAP[key]) return INTENT_OBJECT_MAP[key];

    return VERB_INTENTS[verb] || 'Unknown';
}

function extractEntities(text) {
    const entities = { quoted: '', diagCode: '', path: '', kofPattern: '' };

    const quoteMatch = text.match(/"([^"]+)"/);
    if (quoteMatch) entities.quoted = quoteMatch[1];

    const diagCodes = ['ARITH001', 'SEM011', 'SEM015', 'SEM010', 'CONC001', 'E999'];
    for (const code of diagCodes) {
        if (text.includes(code)) {
            entities.diagCode = code;
            break;
        }
    }

    const pathMatch = text.match(/[\w/\\.-]+\.\w{1,5}/);
    if (pathMatch) entities.path = pathMatch[0];

    return entities;
}

function calculateConfidence(intent, hasVerb, hasObj) {
    let score = 20;
    if (hasVerb) score += 30;
    if (intent !== 'Unknown' && /Create|Edit|Repair|Search|Run/.test(intent)) score += 25;
    if (hasObj) score += 15;
    return Math.min(score, 95);
}

function getCandidateTools(intent) {
    const toolMap = {
        'RepairDiagnostic': ['compiler.check', 'search.text', 'patch.replace'],
        'CreateWebsite': ['fs.write', 'ws.open', 'search.text'],
        'CreateAPI': ['fs.write', 'ws.open', 'search.text'],
        'GenerateCRUD': ['fs.write', 'ws.open', 'search.text'],
        'RunTests': ['compiler.run'],
        'SearchSymbol': ['search.symbol'],
        'CreateFeature': ['fs.write', 'ws.open'],
        'EditFeature': ['fs.write', 'patch.replace']
    };
    return toolMap[intent] || [];
}

self.onmessage = function(e) {
    const { id, text } = e.data;
    const start = performance.now();

    const tokens = tokenize(text);
    const intent = resolveIntent(tokens);
    const entities = extractEntities(text);
    const hasVerb = tokens.some(t => INTENT_MAP[t]);
    const hasObj = Object.keys(OBJECT_PATTERNS).some(p => tokens.join(' ').includes(p));
    const confidence = calculateConfidence(intent, hasVerb, hasObj);
    const tools = getCandidateTools(intent);

    const elapsed = performance.now() - start;

    self.postMessage({
        id,
        result: {
            intent,
            entities,
            confidence,
            tools,
            tokens,
            elapsed: elapsed.toFixed(2)
        }
    });
};
