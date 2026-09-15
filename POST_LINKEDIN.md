# Post LinkedIn — KOF Agent (Final)

---

**Post:**

---

Portamos o Kof Agent pra web.

E não, não é simplesmente "colocaram um chatbot de Kof no navegador".

O port virou praticamente um laboratório de ML aplicado à linguagem.

Tem treinamento de redes neurais direto pela interface, com modelos que vão de ~8 mil até 200 mil parâmetros.

Sim, 200 mil.

Enquanto o mercado tá enfiando bilhões de parâmetros em modelo pra fazer absolutamente qualquer coisa, aqui a ideia é outra.

Modelos pequenos, domínio extremamente específico e intenção estruturada.

O Kof Agent Web tem três partes principais:

→ Treinamento de modelos
→ Geração de código Kof a partir de intenções (API REST, classe, interface, CRUD)
→ Classificação de código Kof (identifica qual padrão aquele código representa)

Ou seja, começa a aparecer um ciclo interessante:

Intenção → modelo → Kof
Kof → modelo → padrão identificado

Isso combina muito com a filosofia do Kof de orientação à intenção.

A ideia não precisa ser transformar o Kof Agent em mais um ChatGPT genérico.

Pode ser justamente o contrário.

Um agente pequeno, especializado e extremamente bom em uma linguagem específica.

E tem uma coisa que eu quero investigar ainda melhor nesse port.

Se esse treinamento realmente está acontecendo 100% no client-side, como os datasets são representados, qual engine de ML está sendo usada e como os modelos são serializados.

Porque aí a brincadeira fica ainda mais interessante.

Em vez de depender de um modelo gigantesco rodando em algum servidor, começa a existir espaço para modelos pequenos e especializados rodando localmente, inclusive treinados para contextos específicos.

Kof Agent Web é um experimento bem interessante sobre até onde dá pra chegar quando você troca "modelo gigante que sabe tudo" por "modelo pequeno que sabe muito bem uma coisa".

🔗 https://wonderrbit.github.io/kof-agent-web/

Koffie voor iedereen ☕

---

## Tags

@Luiz Dranka (initiative)
@Mel Santos (Kof Language creator)

## Hashtags

```
#KofLanguage #EdgeAI #TensorFlowJS #JavaScript #AI #MachineLearning #OpenSource
```

---

**Pronto para postar!**
