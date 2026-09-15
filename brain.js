/**
 * KOF Agent Brain - Translated from KOF to JavaScript
 * 
 * Original: 68_brain.kf
 * Intent recognition + entity extraction for KOF Language
 */

class KofBrain {
    constructor() {
        this.intentMap = {
            // Portuguese verbs → intent
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

        this.objectPatterns = {
            'site': 'Website', 'website': 'Website', 'página': 'Website', 'pagina': 'Website',
            'crud': 'CRUD',
            'api': 'API',
            'rpa': 'RPA',
            'ui': 'UI', 'tela': 'UI', 'interface': 'UI',
            'docs': 'Docs', 'documentação': 'Docs', 'documentacao': 'Docs',
            'teste': 'Tests', 'testes': 'Tests',
            'erro': 'Diagnostic', 'diagnostico': 'Diagnostic', 'erro de compilação': 'Diagnostic',
            'símbolo': 'Symbol', 'função': 'Symbol', 'classe': 'Symbol', 'symbol': 'Symbol'
        };

        this.kofPatterns = this.loadKofPatterns();
    }

    loadKofPatterns() {
        return [
            { name: 'hello', pattern: 'println("Hello World")', keywords: ['olá', 'mundo', 'hello', 'imprimir'] },
            { name: 'function', pattern: 'functionName(params) { ... }', keywords: ['função', 'function', 'método', 'method'] },
            { name: 'record', pattern: 'record Name(field Type)', keywords: ['registro', 'record', 'estrutura'] },
            { name: 'class', pattern: 'class Name { ... }', keywords: ['classe', 'class', 'objeto'] },
            { name: 'list', pattern: 'List<T> items = listOf<T>()', keywords: ['lista', 'list', 'array', 'coleção'] },
            { name: 'map', pattern: 'Map<K,V> map = mapOf<K,V>()', keywords: ['mapa', 'map', 'dicionário'] },
            { name: 'for_loop', pattern: 'for (var item in collection)', keywords: ['loop', 'for', 'iterar', 'para cada'] },
            { name: 'if_else', pattern: 'if (condition) { ... } else { ... }', keywords: ['se', 'if', 'condição', 'senão', 'else'] },
            { name: 'when', pattern: 'when (value) { case ... }', keywords: ['quando', 'when', 'switch', 'caso'] },
            { name: 'lambda', pattern: '(params) -> { ... }', keywords: ['lambda', 'função anônima', 'arrow'] },
            { name: 'http', pattern: 'web.app() / app.get("/path")', keywords: ['http', 'web', 'servidor', 'api', 'rest'] },
            { name: 'json', pattern: 'json.encode(obj) / json.decode<T>(str)', keywords: ['json', 'serializar', 'parse'] },
            { name: 'async', pattern: 'spawn task() / await handle', keywords: ['async', 'assíncrono', 'concorrente', 'thread'] },
            { name: 'try_catch', pattern: 'try { ... } catch (String e) { ... }', keywords: ['try', 'catch', 'erro', 'exceção', 'tratar'] },
            { name: 'inheritance', pattern: 'class Child extends Parent', keywords: ['herança', 'extends', 'herdar'] },
            { name: 'interface', pattern: 'interface Name { method(): Type }', keywords: ['interface', 'contrato', 'abstrato'] },
            { name: 'null_check', pattern: 'if (x != null)', keywords: ['null', 'nulo', 'verificar', 'nil'] },
            { name: 'route', pattern: 'app.get("/users/:id")', keywords: ['rota', 'route', 'endpoint', 'url'] },
            { name: 'database', pattern: 'kof.db / kof.orm', keywords: ['banco', 'database', 'sql', 'orm', 'persistência'] },
            { name: 'record_method', pattern: 'record Name { method() { ... } }', keywords: ['método de registro', 'record com método'] }
        ];
    }

    /**
     * Tokenize input text (simplified version of retTokenize)
     */
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\sáàâãéèêíïóôõúüç]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }

    /**
     * Resolve intent from tokens (brainSynonymIntent + brainResolveIntent)
     */
    resolveIntent(tokens) {
        let verb = '';
        let obj = '';

        // Find verb (intent)
        for (const token of tokens) {
            if (this.intentMap[token] && !verb) {
                verb = this.intentMap[token];
            }
        }

        // Find object
        const joined = tokens.join(' ');
        for (const [pattern, objectType] of Object.entries(this.objectPatterns)) {
            if (joined.includes(pattern)) {
                obj = objectType;
                break;
            }
        }

        if (!verb) return 'Unknown';

        // Combine verb + object into intent
        const intentMap = {
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

        const key = `${obj}+${verb}`;
        if (intentMap[key]) return intentMap[key];

        // Fallback to verb-only intents
        const verbIntents = {
            'create': 'CreateFeature',
            'edit': 'EditFeature',
            'repair': 'RepairGeneric',
            'search': 'SearchGeneric',
            'runtests': 'RunTests',
            'explain': 'ExplainDiagnostic',
            'refactor': 'Refactor'
        };

        return verbIntents[verb] || 'Unknown';
    }

    /**
     * Extract entities from text (brainExtractEntities)
     */
    extractEntities(text) {
        const entities = {
            quoted: '',
            diagCode: '',
            path: '',
            kofPattern: ''
        };

        // Extract quoted text
        const quoteMatch = text.match(/"([^"]+)"/);
        if (quoteMatch) {
            entities.quoted = quoteMatch[1];
        }

        // Extract diagnostic codes
        const diagCodes = ['ARITH001', 'SEM011', 'SEM015', 'SEM010', 'CONC001', 'E999'];
        for (const code of diagCodes) {
            if (text.includes(code)) {
                entities.diagCode = code;
                break;
            }
        }

        // Extract file paths
        const pathMatch = text.match(/[\w/\\.-]+\.\w{1,5}/);
        if (pathMatch) {
            entities.path = pathMatch[0];
        }

        // Match KOF patterns
        const tokens = this.tokenize(text);
        for (const kof of this.kofPatterns) {
            for (const keyword of kof.keywords) {
                if (tokens.includes(keyword) || text.toLowerCase().includes(keyword)) {
                    entities.kofPattern = kof.name;
                    return entities;
                }
            }
        }

        return entities;
    }

    /**
     * Calculate confidence score (brainConfidence)
     */
    calculateConfidence(intent, hasVerb, hasObj, contextItems) {
        let score = 20;
        if (hasVerb) score += 30;
        if (intent !== 'Unknown' && 
            (intent.includes('Create') || intent.includes('Edit') || 
             intent.includes('Repair') || intent.includes('Search') || 
             intent.includes('Run'))) {
            score += 25;
        }
        if (contextItems > 0) score += 15;
        return Math.min(score, 95);
    }

    /**
     * Get candidate tools for intent (brainCandidateTools)
     */
    getCandidateTools(intent) {
        const toolMap = {
            'RepairDiagnostic': ['compiler.check', 'search.text', 'patch.replace'],
            'CreateWebsite': ['fs.write', 'ws.open', 'search.text'],
            'CreateAPI': ['fs.write', 'ws.open', 'search.text'],
            'GenerateCRUD': ['fs.write', 'ws.open', 'search.text'],
            'RunTests': ['compiler.run'],
            'SearchSymbol': ['search.symbol'],
            'CreateFeature': ['fs.write', 'ws.open'],
            'EditFeature': ['fs.write', 'patch.replace'],
            'Refactor': ['fs.write', 'patch.replace', 'search.symbol']
        };
        return toolMap[intent] || [];
    }

    /**
     * Main brain process (brainProcess)
     */
    process(text) {
        const tokens = this.tokenize(text);
        const intent = this.resolveIntent(tokens);
        const entities = this.extractEntities(text);
        const confidence = this.calculateConfidence(
            intent, 
            tokens.length > 0, 
            intent !== 'Unknown', 
            1
        );
        const tools = this.getCandidateTools(intent);

        return {
            intent,
            entities,
            confidence,
            tools,
            tokens,
            timestamp: Date.now()
        };
    }

    /**
     * Generate JSON plan (brainPlanJson)
     */
    toPlanJson(result) {
        return {
            intent: result.intent,
            confidence: result.confidence,
            entities: result.entities,
            tools: result.tools,
            timestamp: result.timestamp
        };
    }
}

// Export for browser/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KofBrain;
} else {
    window.KofBrain = KofBrain;
}
