/**
 * KOF Agent - Neural Classifier with TensorFlow.js
 * 
 * Configurable architecture for testing different neuron counts
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
        this.architecture = null;
    }

    loadPatterns() {
        return [
            { name: 'hello', code: 'println("Hello World")', desc: 'Imprimir' },
            { name: 'function', code: 'functionName(params) { }', desc: 'Função' },
            { name: 'record', code: 'record Name(field Type)', desc: 'Registro' },
            { name: 'class', code: 'class Name { }', desc: 'Classe' },
            { name: 'list', code: 'List<T> items = listOf<T>()', desc: 'Lista' },
            { name: 'map', code: 'Map<K,V> map = mapOf<K,V>()', desc: 'Mapa' },
            { name: 'for_loop', code: 'for (var item in collection)', desc: 'Loop' },
            { name: 'if_else', code: 'if (condition) { } else { }', desc: 'Condicional' },
            { name: 'when', code: 'when (value) { case ... }', desc: 'Switch' },
            { name: 'lambda', code: '(params) -> { }', desc: 'Lambda' },
            { name: 'http', code: 'web.app()', desc: 'HTTP' },
            { name: 'json', code: 'json.encode(obj)', desc: 'JSON' },
            { name: 'async', code: 'spawn task()', desc: 'Async' },
            { name: 'try_catch', code: 'try { } catch (e) { }', desc: 'Erro' },
            { name: 'inheritance', code: 'class Child extends Parent', desc: 'Herança' },
            { name: 'interface', code: 'interface Name { }', desc: 'Interface' },
            { name: 'null_check', code: 'if (x != null)', desc: 'Null' },
            { name: 'route', code: 'app.get("/users/:id")', desc: 'Rota' },
            { name: 'database', code: 'kof.db / kof.orm', desc: 'Database' },
            { name: 'record_method', code: 'record Name { method() { } }', desc: 'Método' }
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

    /**
     * Create model with configurable architecture
     * 
     * Presets:
     * - 'tiny':     Embedding(32) → LSTM(32) → Dense(20)                    ~8k params
     * - 'small':    Embedding(32) → LSTM(48) → Dense(32) → Dense(20)       ~15k params
     * - 'medium':   Embedding(64) → LSTM(64) → LSTM(32) → Dense(32)        ~35k params
     * - 'large':    Embedding(64) → LSTM(128) → LSTM(64) → Dense(64)       ~90k params
     * - 'xlarge':   Embedding(128) → LSTM(256) → LSTM(128) → Dense(128)    ~200k params
     * - 'custom':   use config object
     */
    async createModel(preset = 'small', customConfig = null) {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js not loaded');
            return;
        }

        const numClasses = this.patterns.length;
        const vocabSize = Math.max(this.vocabulary.size + 1, this.vocabSize);

        const configs = {
            tiny: {
                name: 'Tiny',
                layers: [
                    { type: 'embedding', inputDim: vocabSize, outputDim: 32, inputLength: this.maxSequenceLength },
                    { type: 'lstm', units: 32 },
                    { type: 'dense', units: numClasses, activation: 'softmax' }
                ]
            },
            small: {
                name: 'Small',
                layers: [
                    { type: 'embedding', inputDim: vocabSize, outputDim: 32, inputLength: this.maxSequenceLength },
                    { type: 'lstm', units: 48 },
                    { type: 'dense', units: 32, activation: 'relu' },
                    { type: 'dropout', rate: 0.3 },
                    { type: 'dense', units: numClasses, activation: 'softmax' }
                ]
            },
            medium: {
                name: 'Medium',
                layers: [
                    { type: 'embedding', inputDim: vocabSize, outputDim: 64, inputLength: this.maxSequenceLength },
                    { type: 'lstm', units: 64, returnSequences: true },
                    { type: 'lstm', units: 32 },
                    { type: 'dense', units: 32, activation: 'relu' },
                    { type: 'dropout', rate: 0.3 },
                    { type: 'dense', units: numClasses, activation: 'softmax' }
                ]
            },
            large: {
                name: 'Large',
                layers: [
                    { type: 'embedding', inputDim: vocabSize, outputDim: 64, inputLength: this.maxSequenceLength },
                    { type: 'lstm', units: 128, returnSequences: true, dropout: 0.2 },
                    { type: 'lstm', units: 64, dropout: 0.2 },
                    { type: 'dense', units: 64, activation: 'relu' },
                    { type: 'dropout', rate: 0.3 },
                    { type: 'dense', units: numClasses, activation: 'softmax' }
                ]
            },
            xlarge: {
                name: 'XLarge',
                layers: [
                    { type: 'embedding', inputDim: vocabSize, outputDim: 128, inputLength: this.maxSequenceLength },
                    { type: 'lstm', units: 256, returnSequences: true, dropout: 0.2 },
                    { type: 'lstm', units: 128, returnSequences: true, dropout: 0.2 },
                    { type: 'lstm', units: 64, dropout: 0.3 },
                    { type: 'batchNorm': true },
                    { type: 'dense', units: 128, activation: 'relu' },
                    { type: 'dropout', rate: 0.4 },
                    { type: 'dense', units: 64, activation: 'relu' },
                    { type: 'dropout', rate: 0.3 },
                    { type: 'dense', units: numClasses, activation: 'softmax' }
                ]
            }
        };

        const config = customConfig || configs[preset] || configs.small;
        this.architecture = { preset: customConfig ? 'custom' : preset, ...config };

        this.model = tf.sequential();

        for (const layer of config.layers) {
            if (layer.type === 'embedding') {
                this.model.add(tf.layers.embedding({
                    inputDim: layer.inputDim,
                    outputDim: layer.outputDim,
                    inputLength: layer.inputLength
                }));
            } else if (layer.type === 'lstm') {
                this.model.add(tf.layers.lstm({
                    units: layer.units,
                    returnSequences: layer.returnSequences || false,
                    dropout: layer.dropout || 0
                }));
            } else if (layer.type === 'dense') {
                this.model.add(tf.layers.dense({
                    units: layer.units,
                    activation: layer.activation
                }));
            } else if (layer.type === 'dropout') {
                this.model.add(tf.layers.dropout({ rate: layer.rate }));
            } else if (layer.type === 'batchNorm') {
                this.model.add(tf.layers.batchNormalization());
            }
        }

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
            'interface': ['interface contrato', 'definir interface', 'abstração', 'contrato método'],
            'null_check': ['verificar null', 'null safety', 'checar nulo', 'nil check', 'validar null'],
            'route': ['rota http', 'url endpoint', 'path rota', 'definir rota', 'router express'],
            'database': ['banco dados', 'sql query', 'orm persistência', 'database table', 'conexão db'],
            'record_method': ['record método', 'método record', 'behavior record', 'record function']
        };

        for (let i = 0; i < numSamples; i++) {
            const idx = i % this.patterns.length;
            const p = this.patterns[idx];
            const tpls = templates[p.name] || [p.desc];
            const tpl = tpls[Math.floor(Math.random() * tpls.length)];
            const prefixes = ['', 'kof ', 'como ', 'preciso ', 'quero '];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            texts.push(prefix + tpl);
            labels.push(idx);
        }
        return { texts, labels };
    }

    async train(texts, labels, epochs = 10) {
        if (!this.model) await this.createModel('small');
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

        const history = await this.model.fit(xs, ys, {
            epochs,
            batchSize: 32,
            shuffle: true,
            validationSplit: 0.1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)} acc=${logs.acc.toFixed(4)}`);
                }
            }
        });

        xs.dispose();
        ys.dispose();
        this.isReady = true;
        return history;
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
            isReady: this.isReady,
            architecture: this.architecture
        };
    }

    generateCode(intent, entities) {
        const templates = {
            'CreateWebsite': `web.app()\n\napp.get("/") {\n  return "Hello from Kof"\n}\n\napp.listen(8080)`,
            'CreateAPI': `web.app()\n\napp.get("/api/users") {\n  return json.encode(users)\n}\n\napp.post("/api/users") {\n  var user = json.decode<User>(body())\n  return json.encode(user)\n}`,
            'CreateUI': `var w = Window("App")\nvar btn = Button("Clique", () -> {\n  println("Clicado!")\n})\nw.bind(btn)\nw.show()`,
            'GenerateCRUD': `record User(String name, Int age)\n\nweb.app()\n\napp.get("/users") {\n  return json.encode(db.query<User>("SELECT * FROM users"))\n}`,
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
