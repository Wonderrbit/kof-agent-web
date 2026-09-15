"""
KOF Agent - Pre-train and export weights for browser
Train in Python, export as JSON for browser loading
"""

import json
import numpy as np
import os

# Simplified neural network (no TF dependency for export)
class KofPreTrainer:
    def __init__(self, vocab_size=500, embed_dim=32, lstm_units=48, num_classes=20):
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim
        self.lstm_units = lstm_units
        self.num_classes = num_classes
        
        # Initialize weights (simplified LSTM-like)
        np.random.seed(42)
        
        # Embedding layer
        self.embedding = np.random.randn(vocab_size, embed_dim) * 0.1
        
        # LSTM-like weights
        self.W_i = np.random.randn(embed_dim + lstm_units, lstm_units) * 0.1
        self.b_i = np.zeros(lstm_units)
        self.W_f = np.random.randn(embed_dim + lstm_units, lstm_units) * 0.1
        self.b_f = np.ones(lstm_units)
        self.W_c = np.random.randn(embed_dim + lstm_units, lstm_units) * 0.1
        self.b_c = np.zeros(lstm_units)
        self.W_o = np.random.randn(embed_dim + lstm_units, lstm_units) * 0.1
        self.b_o = np.zeros(lstm_units)
        
        # Dense layers
        self.W_d1 = np.random.randn(lstm_units, 32) * 0.1
        self.b_d1 = np.zeros(32)
        self.W_out = np.random.randn(32, num_classes) * 0.1
        self.b_out = np.zeros(num_classes)
        
        # Patterns
        self.patterns = [
            'hello', 'function', 'record', 'class', 'list', 'map',
            'for_loop', 'if_else', 'when', 'lambda', 'http', 'json',
            'async', 'try_catch', 'inheritance', 'interface', 'null_check',
            'route', 'database', 'record_method'
        ]
        
        # Training data
        self.templates = {
            'hello': ['olá mundo', 'hello world', 'imprimir olá', 'mostrar mensagem'],
            'function': ['criar função', 'definir método', 'function calcular', 'método soma'],
            'record': ['criar registro', 'record usuário', 'estrutura dados', 'definir record'],
            'class': ['criar classe', 'class animal', 'definir classe', 'nova classe'],
            'list': ['criar lista', 'lista itens', 'array elementos', 'list dados'],
            'map': ['criar mapa', 'dicionário dados', 'map lookup', 'mapa chave-valor'],
            'for_loop': ['loop para cada', 'iterar lista', 'for coleção', 'repetir itens'],
            'if_else': ['condicional se', 'if else', 'verificar condição', 'se senão'],
            'when': ['switch caso', 'when valor', 'escolha multipla', 'cases seleção'],
            'lambda': ['função anônima', 'lambda expression', 'arrow function', 'closure'],
            'http': ['servidor web', 'http server', 'api rest', 'rota get', 'endpoint'],
            'json': ['serializar json', 'parse json', 'encode objeto', 'decode json'],
            'async': ['async await', 'concorrência', 'spawn thread', 'tarefa assíncrona'],
            'try_catch': ['tratar erro', 'try catch', 'exceção', 'error handling'],
            'inheritance': ['herança classe', 'extends pai', 'filho herda', 'super classe'],
            'interface': ['interface contrato', 'definir interface', 'abstração', 'contrato'],
            'null_check': ['verificar null', 'null safety', 'checar nulo', 'nil check'],
            'route': ['rota http', 'url endpoint', 'path rota', 'definir rota'],
            'database': ['banco dados', 'sql query', 'orm persistência', 'database table'],
            'record_method': ['record método', 'método record', 'behavior record', 'record function']
        }
    
    def tokenize(self, text):
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        return text.split()
    
    def text_to_sequence(self, text, max_len=30):
        tokens = self.tokenize(text)
        seq = []
        for t in tokens[:max_len]:
            # Simple hash for vocabulary
            idx = hash(t) % (self.vocab_size - 1) + 1
            seq.append(idx)
        while len(seq) < max_len:
            seq.append(0)
        return seq[:max_len]
    
    def forward(self, seq):
        # Embedding lookup
        embeds = np.array([self.embedding[idx] for idx in seq])
        
        # Simple LSTM-like forward pass
        h = np.zeros(self.lstm_units)
        c = np.zeros(self.lstm_units)
        
        for t in range(len(embeds)):
            x = np.concatenate([embeds[t], h])
            
            i = sigmoid(x @ self.W_i + self.b_i)
            f = sigmoid(x @ self.W_f + self.b_f)
            o = sigmoid(x @ self.W_o + self.b_o)
            c_tilde = np.tanh(x @ self.W_c + self.b_c)
            
            c = f * c + i * c_tilde
            h = o * np.tanh(c)
        
        # Dense layers
        x = h @ self.W_d1 + self.b_d1
        x = relu(x)
        x = x @ self.W_out + self.b_out
        
        # Softmax
        return softmax(x)
    
    def generate_training_data(self, num_samples=600):
        texts = []
        labels = []
        
        for i in range(num_samples):
            idx = i % len(self.patterns)
            pattern = self.patterns[idx]
            templates = self.templates[pattern]
            template = templates[i % len(templates)]
            
            prefixes = ['', 'kof ', 'como ', 'preciso ', 'quero ']
            prefix = prefixes[i % len(prefixes)]
            
            texts.append(prefix + template)
            labels.append(idx)
        
        return texts, labels
    
    def train(self, epochs=5, lr=0.01):
        texts, labels = self.generate_training_data(200)
        
        print(f"Training with {len(texts)} samples for {epochs} epochs...")
        
        for epoch in range(epochs):
            total_loss = 0
            correct = 0
            
            for text, label in zip(texts, labels):
                seq = self.text_to_sequence(text)
                probs = self.forward(seq)
                
                # Cross entropy loss
                target = np.zeros(self.num_classes)
                target[label] = 1
                loss = -np.sum(target * np.log(probs + 1e-8))
                total_loss += loss
                
                if np.argmax(probs) == label:
                    correct += 1
                
                # Simple gradient update
                grad = probs - target
                self.b_out -= lr * grad
            
            acc = correct / len(texts) * 100
            avg_loss = total_loss / len(texts)
            print(f"Epoch {epoch+1}/{epochs} - loss: {avg_loss:.4f} - acc: {acc:.1f}%")
    
    def export_weights(self, path='model/weights.json'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        weights = {
            'config': {
                'vocab_size': self.vocab_size,
                'embed_dim': self.embed_dim,
                'lstm_units': self.lstm_units,
                'num_classes': self.num_classes,
                'max_sequence_length': 30,
                'patterns': self.patterns
            },
            'weights': {
                'embedding': self.embedding.tolist(),
                'W_i': self.W_i.tolist(),
                'b_i': self.b_i.tolist(),
                'W_f': self.W_f.tolist(),
                'b_f': self.b_f.tolist(),
                'W_c': self.W_c.tolist(),
                'b_c': self.b_c.tolist(),
                'W_o': self.W_o.tolist(),
                'b_o': self.b_o.tolist(),
                'W_d1': self.W_d1.tolist(),
                'b_d1': self.b_d1.tolist(),
                'W_out': self.W_out.tolist(),
                'b_out': self.b_out.tolist()
            }
        }
        
        with open(path, 'w') as f:
            json.dump(weights, f)
        
        size = os.path.getsize(path)
        print(f"Exported weights to {path} ({size} bytes, {size/1024:.1f} KB)")
        return path


def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

def relu(x):
    return np.maximum(0, x)

def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


if __name__ == '__main__':
    trainer = KofPreTrainer()
    trainer.train(epochs=5)
    trainer.export_weights()
    print("Done! Weights exported for browser loading.")
