document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroForm');
    const adicionarTreinamentoBtn = document.getElementById('adicionarTreinamento');
    let treinamentoCount = 1;

    adicionarTreinamentoBtn.addEventListener('click', () => {
        const treinamentosDiv = document.getElementById('treinamentos');
        
        const div = document.createElement('div');
        div.classList.add('border', 'border-gray-300', 'rounded-lg', 'p-4', 'mt-4');
        div.innerHTML = `
            <label for="treinamentoNome${treinamentoCount}" class="block text-sm font-medium text-gray-700">Nome:</label>
            <input type="text" id="treinamentoNome${treinamentoCount}" name="treinamentos[${treinamentoCount}][nome]" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" required>
            
            <label for="treinamentoDescricao${treinamentoCount}" class="block text-sm font-medium text-gray-700 mt-2">Descrição:</label>
            <input type="text" id="treinamentoDescricao${treinamentoCount}" name="treinamentos[${treinamentoCount}][descricao]" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" required>
            
            <label for="dataInicio${treinamentoCount}" class="block text-sm font-medium text-gray-700 mt-2">Data de Início:</label>
            <input type="date" id="dataInicio${treinamentoCount}" name="treinamentos[${treinamentoCount}][data_inicio]" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" required>
            
            <label for="dataFim${treinamentoCount}" class="block text-sm font-medium text-gray-700 mt-2">Data de Fim:</label>
            <input type="date" id="dataFim${treinamentoCount}" name="treinamentos[${treinamentoCount}][data_fim]" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" required>
            
            <label for="status${treinamentoCount}" class="block text-sm font-medium text-gray-700 mt-2">Status:</label>
            <select id="status${treinamentoCount}" name="treinamentos[${treinamentoCount}][status]" class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" required>
                <option value="ativo">Ativo</option>
                <option value="vencendo">Vencendo</option>
                <option value="vencido">Vencido</option>
            </select>
        `;
        treinamentosDiv.appendChild(div);
        treinamentoCount++;
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previne o comportamento padrão de recarregar a página

        // Captura os dados do formulário
        const formData = new FormData(form);

        // Cria um objeto para armazenar as informações
        const colaboradorData = {
            nome: formData.get('nome'),
            treinamentos: []
        };

        // Captura os treinamentos do formulário
        for (let i = 0; i < treinamentoCount; i++) {
            colaboradorData.treinamentos.push({
                nome: formData.get(`treinamentos[${i}][nome]`),
                descricao: formData.get(`treinamentos[${i}][descricao]`),
                data_inicio: formData.get(`treinamentos[${i}][data_inicio]`),
                data_fim: formData.get(`treinamentos[${i}][data_fim]`),
                status: formData.get(`treinamentos[${i}][status]`)
            });
        }

        try {
            // Envia os dados do formulário via fetch para a rota do servidor
            const response = await fetch('/colaborador', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(colaboradorData)
            });

            if (response.ok) {
                alert('Colaborador e treinamentos cadastrados com sucesso');
                form.reset(); // Limpa o formulário
            } else {
                alert('Erro ao cadastrar colaborador e treinamentos');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    });
});
