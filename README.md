
# Programa de cadastro de pessoas com LocalStorage
Projeto desenvolvido por [Gerson Ramos](https://github.com/gersonlramos)

## Sobre o Projeto

O projeto consiste em criar um sistema em JavaScript para armazenamento de dados cadastrais de clientes.

## Definições

* O sistema contém um arquivo HTML simples para manipular os dados cadastrais.
* O cadastro foi desenvolvido utilizando o padrão Factory.
* Os dados mínimos de cadastro são "Nome", "Data de nascimento", "Telefone" e "Email".
* São permitidas as operações de criação, consulta e deleção dos dados de uma pessoa.

## Como Utilizar o Programa

### Clonando o Repositório

Para clonar o repositório, utilize o seguinte comando no terminal:

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
```

### Utilizando o Sistema

1. Abra o arquivo `index.html` em seu navegador de internet.
2. Preencha os campos "Nome", "Data de Nascimento", "Telefone" e "Email".
3. Clique no botão "Salvar" para realizar o registro.

Abaixo dos campos de cadastro, os nomes cadastrados estarão visíveis. Utilize o campo de filtro por nome para localizar registros específicos.

Ao lado dos nomes cadastrados, existem dois botões: "Editar" e "Excluir".

* **Excluir**: Para excluir o registro, basta clicar no botão "Excluir" e confirmar a mensagem de exclusão.
* **Editar**: Para editar, clique no botão "Editar". O registro será carregado nos campos de cadastro, onde você pode fazer as alterações necessárias e salvar novamente.

### Visualização do projeto

![Cadastro de Pessoas](.src/images/Cadastro_Pessoas.gif)

## Passo a Passo da Criação

1. Entendimento do conceito geral e necessidade do cliente.
2. Elaboração da ideia e desenho do projeto.
3. Criação dos arquivos `index.html`, `script.js` e `style.css`.
4. Desenvolvimento do arquivo HTML com os campos desejados.
5. Criação da lógica de programação e código em JavaScript utilizando o padrão Factory.
6. Versão 1: Cadastro pode ser realizado e salvo no LocalStorage.
7. Criação da opção de edição e exclusão dos registros.
8. Criação de um filtro para facilitar a visualização do registro necessário.

## Principais Dificuldades

1. Entendimento de HTML e criação de campos e botões de comando.
2. Compreender como é realizado o input de dados pelos usuários no HTML e posterior integração com o JavaScript como variáveis.
3. Compreender como salvar os dados no LocalStorage.
4. Manipulação do HTML e CSS e como importar a lógica no backend para front e vice-versa.
