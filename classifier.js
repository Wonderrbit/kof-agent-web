/**
 * KOF Agent - Neural Classifier with Pre-trained Weights
 * 
 * Loads pre-computed pattern weights (no training needed)
 * Falls back to TensorFlow.js for additional training if needed
 */

class KofNeuralClassifier {
    constructor() {
        this.brain = new KofBrain();
        this.model = null;
        this.patterns = this.loadPatterns();
        this.pretrained = null;
        this.isReady = false;
        this.vocabulary = new Map();
        this.maxSequenceLength = 30;
        this.vocabSize = 500;
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

    /**
     * Load pre-trained weights from JSON
     */
    async loadPretrained() {
        try {
            const response = await fetch('model/pretrained.json');
            if (response.ok) {
                this.pretrained = await response.json();
                this.isReady = true;
                console.log('Pre-trained weights loaded:', this.pretrained.config);
                return true;
            }
        } catch (e) {
            console.warn('Pre-trained weights not found, using rule-based only');
        }
        return false;
    }

    /**
     * Classify using pre-trained pattern weights
     */
    classifyWithPretrained(text) {
        if (!this.pretrained) return null;

        const tokens = this.brain.tokenize(text);
        const tokenSet = new Set(tokens);
        
        let bestPattern = 'unknown';
        let bestScore = 0;
        const scores = {};

        for (const [patternName, patternData] of Object.entries(this.pretrained.pattern_weights)) {
            let score = 0;
            
            for (const keyword of patternData.keywords) {
                if (tokenSet.has(keyword)) {
                    score += patternData.weight * 2;
                } else if (tokens.some(t => t.includes(keyword) || keyword.includes(t))) {
                    score += patternData.weight;
                }
            }

            scores[patternName] = score;
            
            if (score > bestScore) {
                bestScore = score;
                bestPattern = patternName;
            }
        }

        // Normalize confidence
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const confidence = totalScore > 0 ? bestScore / totalScore : 0;

        // Top 3
        const top3 = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .filter(([_, s]) => s > 0)
            .map(([name, score]) => ({
                name,
                confidence: totalScore > 0 ? (score / totalScore).toFixed(3) : 0
            }));

        return {
            pattern: bestPattern,
            confidence: confidence.toFixed(3),
            top3,
            method: 'pretrained'
        };
    }

    /**
     * Main classify method
     */
    classify(text) {
        const brainResult = this.brain.process(text);

        // Try pre-trained first
        const pretrainedResult = this.classifyWithPretrained(text);
        
        if (pretrainedResult && pretrainedResult.pattern !== 'unknown') {
            return {
                method: 'pretrained',
                intent: brainResult.intent,
                pattern: pretrainedResult.pattern,
                confidence: (brainResult.confidence / 100 + parseFloat(pretrainedResult.confidence)) / 2,
                neuralPattern: pretrainedResult.pattern,
                neuralConfidence: parseFloat(pretrainedResult.confidence),
                tools: brainResult.tools,
                entities: brainResult.entities,
                topPredictions: pretrainedResult.top3
            };
        }

        // Fallback to TF.js if available and trained
        if (this.model && this.isReady && typeof tf !== 'undefined') {
            return this.classifyWithTF(text, brainResult);
        }

        // Final fallback: rule-based
        return {
            method: 'rule-based',
            intent: brainResult.intent,
            pattern: brainResult.entities.kofPattern || 'unknown',
            confidence: brainResult.confidence / 100,
            tools: brainResult.tools,
            entities: brainResult.entities
        };
    }

    /**
     * TF.js classification (if model is trained)
     */
    classifyWithTF(text, brainResult) {
        const sequence = this.textToSequence(text);
        const inputTensor = tf.tensor2d([sequence]);
        const prediction = this.model.predict(inputTensor);
        const probs = prediction.dataSync();
        const maxIdx = probs.indexOf(Math.max(...probs));

        inputTensor.dispose();
        prediction.dispose();

        return {
            method: 'tfjs',
            intent: brainResult.intent,
            pattern: brainResult.entities.kofPattern || this.patterns[maxIdx].name,
            confidence: (brainResult.confidence / 100 + probs[maxIdx]) / 2,
            neuralPattern: this.patterns[maxIdx].name,
            neuralConfidence: probs[maxIdx],
            tools: brainResult.tools,
            entities: brainResult.entities
        };
    }

    /**
     * Build vocabulary for TF.js
     */
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
     * Create TF.js model (optional, for additional training)
     */
    async createModel(preset = 'small') {
        if (typeof tf === 'undefined') return null;

        const numClasses = this.patterns.length;
        const vocabSize = Math.max(this.vocabulary.size + 1, this.vocabSize);

        const configs = {
            small: { embed: 32, lstm: 48, dense: 32 },
            medium: { embed: 64, lstm: 64, dense: 32 },
            large: { embed: 64, lstm: 128, dense: 64 }
        };

        const cfg = configs[preset] || configs.small;

        this.model = tf.sequential();
        this.model.add(tf.layers.embedding({ inputDim: vocabSize, outputDim: cfg.embed, inputLength: this.maxSequenceLength }));
        this.model.add(tf.layers.lstm({ units: cfg.lstm }));
        this.model.add(tf.layers.dense({ units: cfg.dense, activation: 'relu' }));
        this.model.add(tf.layers.dropout({ rate: 0.3 }));
        this.model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

        this.model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

        return this.model;
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

    /**
     * Generate synthetic training data from templates
     */
    generateTrainingData(numSamples = 600) {
        const texts = [];
        const labels = [];
        const intents = Object.keys(this.patterns).map(p => p.name);
        
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

        for (const intent of intents) {
            const intentTemplates = templates[intent] || [intent];
            for (let i = 0; i < Math.ceil(numSamples / intents.length); i++) {
                const template = intentTemplates[i % intentTemplates.length];
                texts.push(template);
                labels.push(intents.indexOf(intent));
            }
        }

        // Shuffle
        const combined = texts.map((t, i) => ({ text: t, label: labels[i] }));
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return {
            texts: combined.slice(0, numSamples).map(c => c.text),
            labels: combined.slice(0, numSamples).map(c => c.label)
        };
    }

    /**
     * Train the TF.js model
     */
    async train(texts, labels, epochs = 10) {
        if (!this.model || typeof tf === 'undefined') {
            console.warn('Model not created or TF.js not available');
            return;
        }

        this.buildVocabulary(texts);
        
        const xs = tf.tensor2d(texts.map(t => this.textToSequence(t)));
        const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), this.patterns.length);

        await this.model.fit(xs, ys, {
            epochs,
            batchSize: 32,
            verbose: 0,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}/${epochs}: loss=${logs.loss?.toFixed(4)}, acc=${logs.acc?.toFixed(4)}`);
                }
            }
        });

        xs.dispose();
        ys.dispose();
        this.isReady = true;
    }

    /**
     * Get model info for stats display
     */
    getModelInfo() {
        if (!this.model) return { params: 0, layers: 0 };
        
        const params = this.model.countParams();
        const layers = this.model.layers.length;
        
        return { params, layers };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = KofNeuralClassifier;
} else {
    window.KofNeuralClassifier = KofNeuralClassifier;
}
