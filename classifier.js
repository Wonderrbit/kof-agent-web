/**
 * KOF Agent Neural Classifier v2-Lite
 * 
 * Optimized for browser performance
 * Lightweight architecture with good accuracy
 */

class KofNeuralClassifier {
    constructor() {
        this.brain = new KofBrain();
        this.model = null;
        this.patterns = this.loadPatterns();
        this.vocabulary = new Map();
        this.maxSequenceLength = 30;
        this.vocabSize = 500;
        this.isReady = false;
    }

    loadPatterns() {
        return [
            { name: 'hello', code: 'println("Hello World")', description: 'Imprimir mensagem' },
            { name: 'function', code: 'functionName(params) { ... }', description: 'Definir função' },
            { name: 'record', code: 'record Name(field Type)', description: 'Criar registro' },
            { name: 'class', code: 'class Name { ... }', description: 'Criar classe' },
            { name: 'list', code: 'List<T> items = listOf<T>()', description: 'Criar lista' },
            { name: 'map', code: 'Map<K,V> map = mapOf<K,V>()', description: 'Criar mapa' },
            { name: 'for_loop', code: 'for (var item in collection)', description: 'Loop de repetição' },
            { name: 'if_else', code: 'if (condition) { ... } else { ... }', description: 'Condicional' },
            { name: 'when', code: 'when (value) { case ... }', description: 'Switch/When' },
            { name: 'lambda', code: '(params) -> { ... }', description: 'Função anônima' },
            { name: 'http', code: 'web.app() / app.get("/path")', description: 'Servidor HTTP' },
            { name: 'json', code: 'json.encode(obj) / json.decode<T>(str)', description: 'Serialização JSON' },
            { name: 'async', code: 'spawn task() / await handle', description: 'Concorrência' },
            { name: 'try_catch', code: 'try { ... } catch (String e) { ... }', description: 'Tratamento de erro' },
            { name: 'inheritance', code: 'class Child extends Parent', description: 'Herança' },
            { name: 'interface', code: 'interface Name { method(): Type }', description: 'Interface' },
            { name: 'null_check', code: 'if (x != null)', description: 'Verificação null' },
            { name: 'route', code: 'app.get("/users/:id")', description: 'Rota HTTP' },
            { name: 'database', code: 'kof.db / kof.orm', description: 'Banco de dados' },
            { name: 'record_method', code: 'record Name { method() { ... } }', description: 'Método em record' }
        ];
    }

    buildVocabulary(texts) {
        const wordCounts = new Map();
        for (const text of texts) {
            const tokens = this.brain.tokenize(text);
            for (const token of tokens) {
                wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
            }
        }
        const sorted = [...wordCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.vocabSize - 1);
        this.vocabulary = new Map();
        sorted.forEach(([word], idx) => {
            this.vocabulary.set(word, idx + 1);
        });
    }

    textToSequence(text) {
        const tokens = this.brain.tokenize(text);
        const sequence = tokens.map(t => this.vocabulary.get(t) || 0);
        while (sequence.length < this.maxSequenceLength) sequence.push(0);
        return sequence.slice(0, this.maxSequenceLength);
    }

    async createModel() {
        if (typeof tf === 'undefined') return;

        const numClasses = this.patterns.length;

        // LITE architecture: ~15k params (fast browser)
        this.model = tf.sequential({
            layers: [
                tf.layers.embedding({
                    inputDim: this.vocabSize,
                    outputDim: 32,
                    inputLength: this.maxSequenceLength
                }),
                tf.layers.lstm({
                    units: 48,
                    dropout: 0.2
                }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: numClasses,
                    activation: 'softmax'
                })
            ]
        });

        this.model.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return this.model;
    }

    generateTrainingData(numSamples = 600) {
        const texts = [];
        const labels = [];

        const templates = {
            'hello': ['olá mundo', 'hello world', 'imprimir olá', 'mostrar mensagem', 'println hello'],
            'function': ['criar função', 'definir método', 'function calcular', 'criar function', 'método soma'],
            'record': ['criar registro', 'record usuário', 'estrutura dados', 'definir record', 'registro campos'],
            'class': ['criar classe', 'class animal', 'definir classe', 'nova classe', 'classe abstrata'],
            'list': ['criar lista', 'lista itens', 'array elementos', 'list dados', 'lista vazia'],
            'map': ['criar mapa', 'dicionário dados', 'map lookup', 'mapa chave-valor', 'tabela consulta'],
            'for_loop': ['loop para cada', 'iterar lista', 'for coleção', 'repetir itens', 'cada elemento'],
            'if_else': ['condicional se', 'if else', 'verificar condição', 'se senão', 'decisão lógica'],
            'when': ['switch caso', 'when valor', 'escolha multipla', 'cases seleção', 'pattern matching'],
            'lambda': ['função anônima', 'lambda expression', 'arrow function', 'closure', 'callback lambda'],
            'http': ['servidor web', 'http server', 'api rest', 'rota get', 'endpoint'],
            'json': ['serializar json', 'parse json', 'encode objeto', 'decode json', 'marshal dados'],
            'async': ['async await', 'concorrência', 'spawn thread', 'tarefa assíncrona', 'parallel'],
            'try_catch': ['tratar erro', 'try catch', 'exceção', 'error handling', 'capturar erro'],
            'inheritance': ['herança classe', 'extends pai', 'filho herda', 'super classe', 'herdar'],
            'interface': ['interface contrato', 'definir interface', 'abstração', 'contrato método', 'interface pública'],
            'null_check': ['verificar null', 'null safety', 'checar nulo', 'nil check', 'validar null'],
            'route': ['rota http', 'url endpoint', 'path rota', 'definir rota', 'router express'],
            'database': ['banco dados', 'sql query', 'orm persistência', 'database table', 'conexão db'],
            'record_method': ['record método', 'método record', 'behavior record', 'record function', 'record ação']
        };

        for (let i = 0; i < numSamples; i++) {
            const idx = i % this.patterns.length;
            const p = this.patterns[idx];
            const tpls = templates[p.name] || [p.description];
            const tpl = tpls[Math.floor(Math.random() * tpls.length)];
            const prefixes = ['', 'kof ', 'como ', 'preciso ', 'quero '];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            texts.push(prefix + tpl);
            labels.push(idx);
        }
        return { texts, labels };
    }

    async train(texts, labels, epochs = 10) {
        if (!this.model) await this.createModel();
        if (!this.model) { this.isReady = true; return; }

        this.buildVocabulary(texts);
        const sequences = texts.map(t => this.textToSequence(t));
        const numClasses = this.patterns.length;
        const oneHot = labels.map(idx => {
            const arr = new Array(numClasses).fill(0);
            arr[idx] = 1;
            return arr;
        });

        const xs = tf.tensor2d(sequences);
        const ys = tf.tensor2d(oneHot);

        await this.model.fit(xs, ys, {
            epochs,
            batchSize: 32,
            shuffle: true,
            validationSplit: 0.1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(3)} acc=${logs.acc.toFixed(3)}`);
                }
            }
        });

        xs.dispose();
        ys.dispose();
        this.isReady = true;
    }

    classify(text) {
        const brainResult = this.brain.process(text);

        if (!this.model || !this.isReady) {
            return {
                method: 'rule-based',
                intent: brainResult.intent,
                pattern: brainResult.entities.kofPattern || 'unknown',
                confidence: brainResult.confidence / 100,
                tools: brainResult.tools,
                entities: brainResult.entities
            };
        }

        const sequence = this.textToSequence(text);
        const inputTensor = tf.tensor2d([sequence]);
        const prediction = this.model.predict(inputTensor);
        const probs = prediction.dataSync();
        const maxIdx = probs.indexOf(Math.max(...probs));

        inputTensor.dispose();
        prediction.dispose();

        return {
            method: 'hybrid',
            intent: brainResult.intent,
            pattern: brainResult.entities.kofPattern || this.patterns[maxIdx].name,
            confidence: (brainResult.confidence / 100 + probs[maxIdx]) / 2,
            neuralPattern: this.patterns[maxIdx].name,
            neuralConfidence: probs[maxIdx],
            tools: brainResult.tools,
            entities: brainResult.entities
        };
    }

    getParamCount() {
        if (!this.model) return 0;
        return this.model.layers.reduce((sum, l) => sum + l.countParams(), 0);
    }

    getModelInfo() {
        return {
            params: this.getParamCount(),
            layers: this.model ? this.model.layers.length : 0,
            vocabSize: this.vocabulary.size,
            numClasses: this.patterns.length,
            isReady: this.isReady
        };
    }

    generateCode(intent, entities) {
        const templates = {
            'CreateWebsite': `web.app()\napp.get("/") {\n  return "Hello from Kof"\n}\napp.listen(8080)`,
            'CreateAPI': `web.app()\napp.get("/api/users") {\n  return json.encode(users)\n}\napp.post("/api/users") {\n  var user = json.decode<User>(body())\n  return json.encode(user)\n}`,
            'CreateUI': `var w = Window("App")\nvar btn = Button("Clique", () -> {\n  println("Clicado!")\n})\nw.bind(btn)\nw.show()`,
            'GenerateCRUD': `record User(String name, Int age)\n\nweb.app()\napp.get("/users") {\n  return json.encode(db.query<User>("SELECT * FROM users"))\n}`,
            'RunTests': `kof test .`
        };
        return templates[intent] || `main() {\n  println("${entities.quoted || 'Hello'}")\n}`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = KofNeuralClassifier;
} else {
    window.KofNeuralClassifier = KofNeuralClassifier;
}
