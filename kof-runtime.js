/**
 * KOF Runtime - Browser Edition
 * 
 * Lightweight runtime for KOF Agent
 * Handles code generation, pattern matching, and KOF-specific operations
 * Optimized for KofJS JIT compilation
 */

const KofRuntime = {
    // Code templates for generation
    TEMPLATES: {
        CreateWebsite: `web.app()

app.get("/") {
  return "Hello from Kof"
}

app.listen(8080)`,

        CreateAPI: `web.app()

app.get("/api/users") {
  return json.encode(users)
}

app.post("/api/users") {
  var user = json.decode<User>(body())
  return json.encode(user)
}

app.listen(8080)`,

        CreateUI: `var w = Window("App")
var btn = Button("Clique", () -> {
  println("Clicado!")
})
w.bind(btn)
w.show()`,

        GenerateCRUD: `record User(String name, Int age)

web.app()

app.get("/users") {
  return json.encode(db.query<User>("SELECT * FROM users"))
}

app.post("/users") {
  var user = json.decode<User>(body())
  db.insert(user)
  return json.encode(user)
}

app.delete("/users/:id") {
  db.delete<User>(param("id"))
  return "deleted"
}`,

        CreateFeature: `main() {
  println("Feature implementada")
}`,

        RunTests: `kof test .`,

        ExplainDiagnostic: `// Diagnóstico explicado
// Verificar causas e soluções`,

        Refactor: `// Refatoração sugerida
// Melhorar estrutura e legibilidade`,

        SearchSymbol: `// Busca de símbolo
// Resultado encontrado`,

        RepairGeneric: `// Correção aplicada
// Verificar resultado`,

        EditFeature: `// Edição realizada
// Atualizar conforme necessário`,

        EditWebsite: `// Website editado
// Atualizar conteúdo`
    },

    // Syntax highlighting for KOF
    highlight(code) {
        return code
            .replace(/\b(record|class|interface|extends|implements|var|val|return|if|else|for|while|when|try|catch|throw|new|this|null|true|false|main|constructor|static)\b/g, '<span class="kw">$1</span>')
            .replace(/\b(String|Int|Long|Bool|Float|Double|List|Map|Set|Void)\b/g, '<span class="ty">$1</span>')
            .replace(/\b(println|print|json\.encode|json\.decode|web\.app|db\.query|db\.insert|db\.delete|listOf|mapOf|setOf|param|query|body|header)\b/g, '<span class="fn">$1</span>')
            .replace(/"([^"]*)"/g, '<span class="st">"$1"</span>')
            .replace(/(\/\/.*)/g, '<span class="cm">$1</span>')
            .replace(/\b(\d+)\b/g, '<span class="nu">$1</span>');
    },

    // Generate code from intent
    generate(intent, entities) {
        const template = this.TEMPLATES[intent];
        if (template) return template;

        // Fallback: generate based on intent
        const name = entities.quoted || 'App';
        return `main() {
  println("${name}")
}`;
    },

    // Classify code pattern
    classify(code) {
        const patterns = [
            { name: 'hello', test: /println\s*\(/ },
            { name: 'function', test: /\w+\s*\([^)]*\)\s*\{/ },
            { name: 'record', test: /record\s+\w+/ },
            { name: 'class', test: /class\s+\w+/ },
            { name: 'list', test: /List<|listOf/ },
            { name: 'map', test: /Map<|mapOf/ },
            { name: 'for_loop', test: /for\s*\(/ },
            { name: 'if_else', test: /if\s*\(/ },
            { name: 'when', test: /when\s*\(/ },
            { name: 'lambda', test: /->\s*\{/ },
            { name: 'http', test: /web\.app|app\.(get|post|put|delete)/ },
            { name: 'json', test: /json\.(encode|decode)/ },
            { name: 'async', test: /spawn|await/ },
            { name: 'try_catch', test: /try\s*\{|catch\s*\(/ },
            { name: 'inheritance', test: /extends\s+\w+/ },
            { name: 'interface', test: /interface\s+\w+/ },
            { name: 'null_check', test: /!=\s*null|==\s*null/ },
            { name: 'route', test: /app\.(get|post)\s*\(\s*"[^"]*:[^"]*"/ },
            { name: 'database', test: /kof\.db|kof\.orm|db\.(query|insert|delete)/ },
            { name: 'record_method', test: /record\s+\w+.*\{[^}]*\w+\(/ }
        ];

        for (const pattern of patterns) {
            if (pattern.test.test(code)) {
                return {
                    pattern: pattern.name,
                    confidence: 0.95,
                    method: 'pattern-matching'
                };
            }
        }

        return {
            pattern: 'unknown',
            confidence: 0,
            method: 'no-match'
        };
    },

    // Get all patterns
    getPatterns() {
        return [
            { name: 'hello', code: 'println("Hello World")', desc: 'Imprimir mensagem' },
            { name: 'function', code: 'functionName(params) { ... }', desc: 'Definir função' },
            { name: 'record', code: 'record Name(field Type)', desc: 'Criar registro' },
            { name: 'class', code: 'class Name { ... }', desc: 'Criar classe' },
            { name: 'list', code: 'List<T> items = listOf<T>()', desc: 'Criar lista' },
            { name: 'map', code: 'Map<K,V> map = mapOf<K,V>()', desc: 'Criar mapa' },
            { name: 'for_loop', code: 'for (var item in collection)', desc: 'Loop' },
            { name: 'if_else', code: 'if (condition) { ... }', desc: 'Condicional' },
            { name: 'when', code: 'when (value) { case ... }', desc: 'Switch' },
            { name: 'lambda', code: '(params) -> { ... }', desc: 'Lambda' },
            { name: 'http', code: 'web.app()', desc: 'Servidor HTTP' },
            { name: 'json', code: 'json.encode(obj)', desc: 'JSON' },
            { name: 'async', code: 'spawn task()', desc: 'Concorrência' },
            { name: 'try_catch', code: 'try { ... } catch (e) { ... }', desc: 'Erro' },
            { name: 'inheritance', code: 'class Child extends Parent', desc: 'Herança' },
            { name: 'interface', code: 'interface Name { ... }', desc: 'Interface' },
            { name: 'null_check', code: 'if (x != null)', desc: 'Null check' },
            { name: 'route', code: 'app.get("/users/:id")', desc: 'Rota HTTP' },
            { name: 'database', code: 'kof.db / kof.orm', desc: 'Banco de dados' },
            { name: 'record_method', code: 'record Name { method() { ... } }', desc: 'Método' }
        ];
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.KofRuntime = KofRuntime;
}
