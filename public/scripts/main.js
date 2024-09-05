document.addEventListener('DOMContentLoaded', () => {
    const formColaborador = document.getElementById('formColaborador');
    const formTreinamentos = document.getElementById('formTreinamentos');
    const treinamentosContainer = document.getElementById('treinamentosContainer');
    const addTreinamentoButton = document.getElementById('addTreinamento');

    // Função para cadastrar colaborador
    formColaborador.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('colaboradorNome').value;

        try {
            const response = await fetch('/colaborador', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome })
            });
            if (response.ok) {
                alert('Colaborador cadastrado com sucesso');
                formColaborador.reset();
            } else {
                alert('Erro ao cadastrar colaborador');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    });

    // Adicionar um novo formulário de treinamento
    addTreinamentoButton.addEventListener('click', () => {
        const div = document.createElement('div');
        div.classList.add('treinamento', 'mb-4');
        div.innerHTML = `
            <input type="text" placeholder="Nome do Treinamento" class="border p-2 w-full treinamentoNome">
            <textarea placeholder="Descrição" class="border p-2 w-full treinamentoDescricao"></textarea>
            <input type="date" placeholder="Data de Início" class="border p-2 w-full treinamentoDataInicio">
            <input type="date" placeholder="Data de Fim" class="border p-2 w-full treinamentoDataFim">
            <select class="border p-2 w-full treinamentoStatus">
                <option value="ativo">Ativo</option>
                <option value="vencido">Vencido</option>
                <option value="pendente">Pendente</option>
            </select>
            <button type="button" class="bg-red-500 text-white p-2 removeTreinamento">Remover</button>
        `;
        treinamentosContainer.appendChild(div);

        // Adicionar evento para o botão de remover treinamento
        div.querySelector('.removeTreinamento').addEventListener('click', () => {
            treinamentosContainer.removeChild(div);
        });
    });

    // Função para adicionar treinamentos
    formTreinamentos.addEventListener('submit', async (event) => {
        event.preventDefault();

        const colaboradorId = document.getElementById('colaboradorId').value;
        const treinamentos = Array.from(document.querySelectorAll('.treinamento')).map(treinamento => {
            return {
                nome: treinamento.querySelector('.treinamentoNome').value,
                descricao: treinamento.querySelector('.treinamentoDescricao').value,
                data_inicio: treinamento.querySelector('.treinamentoDataInicio').value,
                data_fim: treinamento.querySelector('.treinamentoDataFim').value,
                status: treinamento.querySelector('.treinamentoStatus').value
            };
        });

        try {
            const response = await fetch('/treinamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ colaborador_id: colaboradorId, treinamentos })
            });
            if (response.ok) {
                alert('Treinamentos cadastrados com sucesso');
                formTreinamentos.reset();
                treinamentosContainer.innerHTML = ''; // Limpar treinamentos
            } else {
                alert('Erro ao cadastrar treinamentos');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    });
});
