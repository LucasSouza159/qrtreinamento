document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const colaboradorId = urlParams.get('id');
    
    if (!colaboradorId) {
        alert('ID do colaborador não fornecido.');
        return;
    }

    const colaboradorNomeElement = document.getElementById('colaboradorNome');
    const treinamentosListElement = document.getElementById('treinamentosList');

    // Função para obter informações do colaborador
    async function fetchColaborador() {
        try {
            const response = await fetch(`/colaborador/${colaboradorId}`);
            if (response.ok) {
                const colaborador = await response.json();
                colaboradorNomeElement.textContent = colaborador.nome;
            } else {
                alert('Erro ao carregar informações do colaborador');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    // Função para obter os treinamentos do colaborador
    async function fetchTreinamentos() {
        try {
            const response = await fetch(`/treinamentos/${colaboradorId}`);
            if (response.ok) {
                const treinamentos = await response.json();
                treinamentosListElement.innerHTML = treinamentos.map(treinamento => `
                    <li class="border p-4 rounded-lg">
                        <h3 class="font-semibold">${treinamento.nome}</h3>
                        <p><strong>Descrição:</strong> ${treinamento.descricao}</p>
                        <p><strong>Data de Início:</strong> ${treinamento.data_inicio}</p>
                        <p><strong>Data de Fim:</strong> ${treinamento.data_fim}</p>
                        <p><strong>Status:</strong> ${treinamento.status}</p>
                    </li>
                `).join('');
            } else {
                alert('Erro ao carregar treinamentos');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    fetchColaborador();
    fetchTreinamentos();
});
