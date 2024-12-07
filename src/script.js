// Criação de uma função para armazenar os cadastros como pessoas ----- mudança pra modelo factory
function newPessoa(nome, dataNascimento, telefone, email) {
    const pessoa = {
        nome: nome.toUpperCase(), // Coloca todo nome em letras maiúsculas
        dataNascimento: dataNascimento,
        telefone: telefone,
        email: email,
    };
    return pessoa;
}

// Função para formatar o telefone ao digitar
function formatarTelefoneInput(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
        value = `(${value.slice(0, 2)})${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
        value = `(${value.slice(0, 2)})${value.slice(2)}`;
    }

    input.value = value;
}

// Função para salvar dados no LocalStorage
function salvarNoLocalStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

// Função para recuperar dados do LocalStorage
function recuperarDoLocalStorage(chave) {
    const dadosString = localStorage.getItem(chave);
    return dadosString ? JSON.parse(dadosString) : [];
}

// Função para carregar a lista de pessoas do LocalStorage
function carregarListaPessoas() {
    return recuperarDoLocalStorage('listaPessoas');
}

// Função para salvar a lista de pessoas no LocalStorage
function salvarListaPessoas(listaPessoas) {
    salvarNoLocalStorage('listaPessoas', listaPessoas);
}

// Função para adicionar uma nova pessoa à lista
function adicionarPessoa(pessoa) {
    const listaPessoas = carregarListaPessoas();
    listaPessoas.push(pessoa);
    salvarListaPessoas(listaPessoas);
    exibirListaPessoas();
}

// Função para atualizar uma pessoa na lista
function atualizarPessoa(indice, pessoaAtualizada) {
    const listaPessoas = carregarListaPessoas();
    listaPessoas[indice] = pessoaAtualizada;
    salvarListaPessoas(listaPessoas);
    exibirListaPessoas();
}

// Função para remover uma pessoa da lista
function removerPessoa(indice) {
    const listaPessoas = carregarListaPessoas();

    // Confirmação antes da remoção
    if (!confirm(`Deseja realmente remover o registro ${listaPessoas[indice].nome}?`)) {
        return; // cancela a remoção se o usuário clicar em "Cancelar"
    }
    listaPessoas.splice(indice, 1);
    salvarListaPessoas(listaPessoas);
    exibirListaPessoas();
}

// Função para exibir a lista de pessoas com filtro
function exibirListaPessoas(filtro = '') {
    const listaPessoas = carregarListaPessoas();
    const listaFiltrada = listaPessoas
        .map((pessoa, indice) => ({ pessoa, indice }))
        .filter(({ pessoa }) => pessoa.nome.toLowerCase().includes(filtro.toLowerCase()));

    const listaHTML = listaFiltrada.map(({ pessoa, indice }) => `
        <li>
            <div class="info">
                ${pessoa.nome} - ${pessoa.dataNascimento} - ${pessoa.telefone} - ${pessoa.email}
            </div>
            <div class="actions">
                <button class="editar" onclick="editarPessoa(${indice})">Editar</button>
                <button class="remover" onclick="removerPessoa(${indice})">Remover</button>
            </div>
        </li>
    `).join('');

    document.getElementById("lista-pessoas").innerHTML = listaHTML;
}

// Função para editar uma pessoa
function editarPessoa(indice) {
    const listaPessoas = carregarListaPessoas();
    const pessoa = listaPessoas[indice];

    document.getElementById('nome').value = pessoa.nome;
    document.getElementById('dataNascimento').value = pessoa.dataNascimento;
    document.getElementById('telefone').value = pessoa.telefone;
    document.getElementById('email').value = pessoa.email;

    document.getElementById('indice').value = indice;
}

// Manipulação do formulário de cadastro
document.getElementById('formulario-cadastro').addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nome = document.getElementById('nome').value;
    const dataNascimento = document.getElementById('dataNascimento').value;
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const indice = document.getElementById('indice').value;

    const pessoa = newPessoa(nome, dataNascimento, telefone, email);

    if (indice === '') {
        adicionarPessoa(pessoa);
    } else {
        atualizarPessoa(parseInt(indice), pessoa);
    }

    document.getElementById('formulario-cadastro').reset();
    document.getElementById('indice').value = '';
    exibirListaPessoas();
});

// Adicionar filtro de pesquisa
document.getElementById('filtro-nome').addEventListener('input', (evento) => {
    exibirListaPessoas(evento.target.value);
});

// Adicionar formatação de telefone ao digitar
document.getElementById('telefone').addEventListener('input', formatarTelefoneInput);

// Carregar a lista de pessoas ao iniciar a página
exibirListaPessoas();
