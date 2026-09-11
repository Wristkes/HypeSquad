# 🏠 HypeSquad Manager

 Bot Discord para gerenciar sua insígnia de HypeSquad direto pelo chat, com painel em Components V2.


## 📦 O que é

 Um bot pessoal que abre um painel no Discord com select menu para trocar sua casa de HypeSquad (Bravery, Brilliance ou Balance) ou remover a insígnia do perfil. O token da sua conta é inserido via modal e fica apenas na memória — nunca salvo em disco.

>Também inclui um script Python para extrair seu token do Discord instalado no Windows automaticamente.



## 🤖 Bot (TypeScript)

### Pré-requisitos

> - [Node.js](https://nodejs.org) v18 ou superior
> - Conta no [Discord Developer Portal](https://discord.com/developers/applications)

### Instalação

 **1.** Clone ou baixe os arquivos do projeto

 **2.** Instale as dependências:
 ```bash
 npm install
 ```

**3.** Abra o `src/HypeSquad.ts` e preencha:
 ```ts
 const BOT_TOKEN  = 'SEU_BOT_TOKEN';   // token do bot
 const CLIENT_ID  = 'SEU_CLIENT_ID';   // ID da aplicação
 const BANNER_URL = 'URL_DA_IMAGEM';   // URL da imagem do painel
 ```

> **4.** No Developer Portal, ative as seguintes intents:
> - `MESSAGE CONTENT INTENT`
> - `SERVER MEMBERS INTENT`

### Rodando

 Modo desenvolvimento (sem compilar):
 ```bash
 npm run dev
 ``` 

### Uso

 Digite no chat do Discord:
 ```
 !hype
 ```
 O painel vai abrir. Selecione **⚙️ Configurar conta**, cole seu token pessoal no modal e pronto — as opções de insígnia são liberadas.



## 🐍 Extrator de Token (Python)

 Script que lê os arquivos locais do Discord e descriptografa seu token automaticamente via **DPAPI + AES-GCM**.

 ⚠️ Funciona apenas no **Windows** com o Discord desktop instalado.

### Pré-requisitos

> - Python 3.8 ou superior
> - Discord desktop instalado e logado

### Instalação

> Instale as dependências:
> ```bash
> pip install pywin32 pycryptodome
> ```

### Rodando

 ```bash
 python token.py
 ```


## ⚠️ Aviso

> Usar o token pessoal da sua conta em scripts é contra os **Termos de Serviço do Discord**. Use apenas para fins pessoais e não compartilhe seu token com ninguém.
