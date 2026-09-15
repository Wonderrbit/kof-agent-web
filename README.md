<div dir="ltr">

# KOF Agent Web

> Agente Neural para Kof Language — gera código KOF a partir de comandos em português.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
[![Kof Language](https://img.shields.io/badge/Kof-Language-purple)](https://koflang.github.io)

---

## O Que É

O KOF Agent é um assistente de programação que **traduz comandos em português para código KOF**.

Você digita algo como *"Criar uma API REST para usuários"*, e o agente:
1. **Analisa** a intenção (criar, editar, corrigir, etc.)
2. **Identifica** o padrão KOF (rota, classe, função, etc.)
3. **Gera** o código KOF correto

### Exemplo

```
Você: Criar uma API REST para gerenciar usuários

Agente gera:
┌─────────────────────────────────────────────┐
│ web.app()                                   │
│                                             │
│ app.get("/api/users") {                     │
│   return json.encode(users)                 │
│ }                                           │
│                                             │
│ app.post("/api/users") {                    │
│   var user = json.decode<User>(body())      │
│   return json.encode(user)                  │
│ }                                           │
│                                             │
│ app.listen(8080)                            │
└─────────────────────────────────────────────┘
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Brain   │───▶│  Classifier  │───▶│  Generator   │  │
│  │ (Regras) │    │  (Neural)    │    │  (Templates) │  │
│  └──────────┘    └──────────────┘    └──────────────┘  │
│       │                │                     │          │
│       ▼                ▼                     ▼          │
│  Intent +        Padrão KOF            Código KOF       │
│  Entidades       Identificado          Gerado           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  TensorFlow.js    │  brain.js   │  classifier.js       │
│  (Rede Neural)    │  (Regras)   │  (Templates)         │
└─────────────────────────────────────────────────────────┘
```

### Componentes

| Componente | Arquivo | O Que Faz |
|------------|---------|-----------|
| **Brain** | `brain.js` | Analisa intenção em português (regras) |
| **Classifier** | `classifier.js` | Classifica padrão com rede neural |
| **Interface** | `index.html` | UI para interação |

### Brain (Análise de Intenção)

O Brain é traduzido do repositório oficial [kof-agent](https://github.com/KofLang/kof-agent), componente `68_brain.kf`.

```javascript
// Exemplo de análise
brainProcess("Criar uma API REST")
// → intent: "CreateAPI"
// → confidence: 85%
// → tools: ["fs.write", "ws.open"]
```

**Intents suportados:**

| Intent | Quando Usado |
|--------|--------------|
| `CreateWebsite` | Criar site ou página web |
| `CreateAPI` | Criar API REST |
| `CreateFeature` | Criar funcionalidade geral |
| `CreateUI` | Criar interface gráfica |
| `GenerateCRUD` | Gerar operações CRUD |
| `RepairDiagnostic` | Corrigir erro de compilação |
| `RunTests` | Executar testes |
| `SearchSymbol` | Buscar símbolo no código |
| `ExplainDiagnostic` | Explicar erro |
| `Refactor` | Refatorar código |

### Classifier (Rede Neural)

Arquitetura otimizada para browser:

```
Embedding(500, 32) → LSTM(48) → Dense(32) → Dropout(0.3) → Dense(20)
```

| Métrica | Valor |
|---------|-------|
| Parâmetros | ~15,000 |
| Camadas | 5 |
| Vocabulário | 500 palavras |
| Treino | ~2 segundos |
| Latência | <10ms |

**20 padrões KOF reconhecidos:**

| # | Padrão | Exemplo |
|---|--------|---------|
| 1 | hello | `println("Hello World")` |
| 2 | function | `functionName(params) { ... }` |
| 3 | record | `record Name(field Type)` |
| 4 | class | `class Name { ... }` |
| 5 | list | `List<T> items = listOf<T>()` |
| 6 | map | `Map<K,V> map = mapOf<K,V>()` |
| 7 | for_loop | `for (var item in collection)` |
| 8 | if_else | `if (condition) { ... } else { ... }` |
| 9 | when | `when (value) { case ... }` |
| 10 | lambda | `(params) -> { ... }` |
| 11 | http | `web.app() / app.get("/path")` |
| 12 | json | `json.encode(obj) / json.decode<T>(str)` |
| 13 | async | `spawn task() / await handle` |
| 14 | try_catch | `try { ... } catch (String e) { ... }` |
| 15 | inheritance | `class Child extends Parent` |
| 16 | interface | `interface Name { method(): Type }` |
| 17 | null_check | `if (x != null)` |
| 18 | route | `app.get("/users/:id")` |
| 19 | database | `kof.db / kof.orm` |
| 20 | record_method | `record Name { method() { ... } }` |

---

## Instalação

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexão com internet (para carregar TensorFlow.js via CDN)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/SEU-USER/kof-agent-web.git
cd kof-agent-web
```

### Passo 2: Abrir no Navegador

**Opção A — Duplo clique:**
```
Dê duplo clique em index.html
```

**Opção B — Terminal:**

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

**Opção C — Servidor local (recomendado para desenvolvimento):**

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# Then open
# http://localhost:8080
```

### Passo 3: Treinar o Modelo

1. Clique em **"Treinar Modelo Neural"** (botão no topo)
2. Aguarde ~2 segundos
3. Pronto! O agente está funcional.

---

## Uso

### 1. Analisar Intenção (Brain)

No card **"Análise Brain"**, digite um comando em português:

```
Criar uma API REST para gerenciar usuários
```

Clique em **"Analisar Comando"**.

**Resultado:**
```json
{
  "intent": "CreateAPI",
  "confidence": 85,
  "tools": ["fs.write", "ws.open"],
  "entities": {
    "quoted": "",
    "diagCode": "",
    "path": ""
  }
}
```

### 2. Classificar Código (Neural)

No card **"Classificação Neural"**, cole ou digite código KOF:

```
app.get("/users/:id") {
  return json.encode(user)
}
```

Clique em **"Classificar"**.

**Resultado:**
```json
{
  "method": "hybrid",
  "intent": "Unknown",
  "pattern": "route",
  "confidence": 0.92,
  "neuralConfidence": 0.94
}
```

### 3. Gerar Código

No card **"Gerador de Código"**, descreva o que precisa:

```
Criar uma interface com botão que mostra mensagem
```

Clique em **"Gerar Código KOF"**.

**Resultado:**
```kof
var w = Window("App")
var btn = Button("Clique", () -> {
  println("Clicado!")
})
w.bind(btn)
w.show()
```

### 4. Padrões Disponíveis

Clique em qualquer card na seção **"Padrões KOF (20)"** para ver o código de exemplo e classificar automaticamente.

---

## Exemplos

### Exemplo 1: Criar API

**Entrada:** `Criar API de produtos com GET e POST`

**Saída:**
```kof
web.app()

app.get("/api/products") {
  return json.encode(products)
}

app.post("/api/products") {
  var product = json.decode<Product>(body())
  return json.encode(product)
}

app.listen(8080)
```

### Exemplo 2: Criar Interface

**Entrada:** `Criar janela com botão e label`

**Saída:**
```kof
var w = Window("App")
var label = Label("Conteúdo")
var btn = Button("Clique", () -> {
  label.text = "Mudou!"
})
w.bind(label)
w.bind(btn)
w.show()
```

### Exemplo 3: Criar Classe

**Entrada:** `Definir classe Animal com nome e idade`

**Saída:**
```kof
class Animal {
  String name
  Int age
  
  constructor(String n, Int a) {
    name = n
    age = a
  }
  
  toString(): String {
    return name + " (" + age + " anos)"
  }
}
```

### Exemplo 4: Tratar Erro

**Entrada:** `Tratar erro SEM011`

**Saída:**
```kof
// Diagnóstico: SEM011 - Variável ou tipo indefinido
// Verificar se a variável foi declarada
// Verificar se o tipo existe no escopo atual
```

---

## Estrutura do Projeto

```
kof-agent-web/
├── index.html          # Interface principal
├── brain.js            # Análise de intenção (regras)
├── classifier.js       # Classificador neural
├── README.md           # Esta documentação
└── LICENSE             # GPLv3
```

### Dependências (CDN)

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| TensorFlow.js | 4.17.0 | Rede neural no browser |
| Highlight.js | 11.9.0 | Syntax highlighting |

---

## Tecnologias

| Tecnologia | Papel |
|------------|-------|
| **JavaScript ES6+** | Linguagem principal |
| **TensorFlow.js** | Rede neural (LSTM) |
| **HTML5/CSS3** | Interface |
| **KOF Brain** | Lógica de intenção (port de `68_brain.kf`) |

---

## Como Funciona Internamente

### Fluxo de Dados

```
1. Usuário digita: "Criar uma API REST"
                    │
2. Brain tokeniza: ["criar", "uma", "api", "rest"]
                    │
3. Brain resolve intent:
   - "criar" → verb: "create"
   - "api" → obj: "API"
   - intent: "CreateAPI"
                    │
4. Classifier (neural) identifica padrão:
   - Input: [5, 12, 3, 0, 0, ...]
   - Output: [0.02, 0.01, ..., 0.89, ...]
   - Padrão: "http" (89% confidence)
                    │
5. Generator gera código baseado no intent:
   - Template: "CreateAPI"
   - Código: web.app() + rotas
                    │
6. Usuário recebe código KOF pronto
```

### Treinamento da Rede Neural

```javascript
// Dados de treino (sintéticos)
const texts = [
  "criar api", "api rest", "servidor web",
  "criar função", "definir método", "function soma",
  "criar classe", "class animal", "definir classe",
  // ... 600 amostras
];

// Arquitetura
Embedding(500, 32) → LSTM(48) → Dense(32) → Dense(20)

// Treino
- Épocas: 10
- Batch: 32
- Optimizer: Adam
- Loss: CategoricalCrossentropy
```

---

## Solução de Problemas

### Modelo não treina

**Causa:** TensorFlow.js não carregou.

**Solução:**
1. Verifique sua conexão com internet
2. Abra o console do navegador (F12)
3. Verifique se há erros de rede

### Classificação errada

**Causa:** Padrão não reconhecido.

**Solução:**
1. Treine o modelo novamente
2. Use sinônimos: "criar" / "gerar" / "definir"
3. Seja mais específico: "Criar API REST" > "Fazer coisa"

### Interface não carrega

**Causa:** Arquivos faltando.

**Solução:**
1. Verifique se todos os arquivos estão na mesma pasta
2. `index.html`, `brain.js`, `classifier.js`

---

## Licença

Este projeto está sob a licença GPL v3.0 — veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## Créditos

- **Brain Logic** — Traduzido do [kof-agent](https://github.com/KofLang/kof-agent) (`68_brain.kf`)
- **Kof Language** — [koflang.github.io](https://koflang.github.io)
- **TensorFlow.js** — [tensorflow.org/js](https://www.tensorflow.org/js)

---

## Contato

**Luiz Dranka** — Engenheiro de Software Aplicado a IA

Projeto: [kof-agent-web](https://github.com/SEU-USER/kof-agent-web)

---

<div align="center">

**Feito com pour both KOF Language & TensorFlow.js**

*Menos código. Mais intenção.*

</div>

</div>
