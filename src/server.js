const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const schedule = require('node-schedule');  // Módulo para agendamento de tarefas
const multer = require('multer');
const xlsx = require('xlsx');

dotenv.config();
const app = express();
const port = 3000;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados MySQL');
    }
});

app.use(express.json());
app.use(express.static('public'));

// Rota para criar um novo colaborador e retornar o ID
app.post('/colaborador', (req, res) => {
    const { nome, matricula, treinamentos } = req.body;

    // Verifica se o colaborador já existe pela matrícula e nome
    const checkColaboradorQuery = `SELECT id FROM colaboradores WHERE nome = ? AND matricula = ?`;
    db.query(checkColaboradorQuery, [nome, matricula], (err, result) => {
        if (err) {
            return res.status(500).send('Erro ao verificar colaborador');
        }

        let colaboradorId;

        if (result.length > 0) {
            // Colaborador já existe, usa o ID retornado
            colaboradorId = result[0].id;
            console.log(`Colaborador ${nome} já existe com ID ${colaboradorId}`);
            // Adiciona apenas o treinamento ao colaborador existente
            inserirTreinamentos(colaboradorId, treinamentos, res);
        } else {
            // Colaborador não existe, insere novo colaborador
            const insertColaboradorQuery = `INSERT INTO colaboradores (nome, matricula) VALUES (?, ?)`;
            db.query(insertColaboradorQuery, [nome, matricula], (err, insertResult) => {
                if (err) {
                    return res.status(500).send('Erro ao cadastrar colaborador');
                }
                colaboradorId = insertResult.insertId;
                console.log(`Novo colaborador ${nome} cadastrado com ID ${colaboradorId}`);
                // Insere os treinamentos para o novo colaborador
                inserirTreinamentos(colaboradorId, treinamentos, res);
            });
        }
    });
});

// Rota para adicionar múltiplos treinamentos
app.post('/treinamento', (req, res) => {
    const { colaborador_id, treinamentos } = req.body;
    const query = `
        INSERT INTO treinamentos (colaborador_id, nome, descricao, data_inicio, data_fim, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    treinamentos.forEach(treinamento => {
        db.query(query, [colaborador_id, treinamento.nome, treinamento.descricao, treinamento.data_inicio, treinamento.data_fim, treinamento.status], (err) => {
            if (err) {
                res.status(500).send('Erro ao cadastrar treinamentos');
                return;
            }
        });
    });

    res.status(201).send('Treinamentos cadastrados com sucesso');
});

// Rota para editar treinamento
app.put('/treinamento/:id', (req, res) => {
    const treinamentoId = req.params.id;
    const { nome, descricao, data_inicio, data_fim, status } = req.body;
    const query = `
        UPDATE treinamentos
        SET nome = ?, descricao = ?, data_inicio = ?, data_fim = ?, status = ?
        WHERE id = ?
    `;
    db.query(query, [nome, descricao, data_inicio, data_fim, status, treinamentoId], (err, result) => {
        if (err) {
            res.status(500).send('Erro ao atualizar treinamento');
        } else {
            res.status(200).send('Treinamento atualizado com sucesso');
        }
    });
});


// Rota para obter informações do colaborador por ID
app.get('/colaborador/:id', (req, res) => {
    const colaboradorId = req.params.id;
    const query = `
        SELECT * FROM colaboradores
        WHERE id = ?
    `;
    db.query(query, [colaboradorId], (err, result) => {
        if (err) {
            res.status(500).send('Erro ao buscar colaborador');
        } else if (result.length === 0) {
            res.status(404).send('Colaborador não encontrado');
        } else {
            res.json(result[0]);
        }
    });
});

// Rota para editar colaborador
app.put('/colaborador/:id', (req, res) => {
    const colaboradorId = req.params.id;
    const { nome } = req.body;
    const query = `
        UPDATE colaboradores
        SET nome = ?
        WHERE id = ?
    `;
    db.query(query, [nome, colaboradorId], (err, result) => {
        if (err) {
            res.status(500).send('Erro ao atualizar colaborador');
        } else {
            res.status(200).send('Colaborador atualizado com sucesso');
        }
    });
});


// Rota para gerar e baixar o QR Code com matrícula no nome do arquivo
app.get('/qrcode/download/:id', (req, res) => {
    const colaboradorId = req.params.id;

    // Primeiro, obtenha a matrícula do colaborador pelo ID
    const query = `SELECT matricula FROM colaboradores WHERE id = ?`;
    db.query(query, [colaboradorId], async (err, result) => {
        if (err) {
            return res.status(500).send('Erro ao buscar matrícula do colaborador');
        }

        if (result.length > 0) {
            const matricula = result[0].matricula;
            const url = `http://localhost:3000/treinamentos.html?id=${colaboradorId}`;

            try {
                // Gerar o QR code
                const qrCodeImage = await qrcode.toDataURL(url);
                const imgBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');
                
                // Definir o nome do arquivo com a matrícula
                const fileName = `qrcode_${matricula}.png`;

                // Definir os headers para o download do arquivo com o novo nome
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Type', 'image/png');
                res.send(imgBuffer);
            } catch (err) {
                res.status(500).send('Erro ao gerar QR Code');
            }
        } else {
            res.status(404).send('Colaborador não encontrado');
        }
    });
});



// Rota para pesquisar colaborador por matrícula
app.get('/pesquisar/:matricula', (req, res) => {
    const { matricula } = req.params;
    const query = `SELECT * FROM colaboradores WHERE matricula = ?`;

    db.query(query, [matricula], (err, result) => {
        if (err) {
            return res.status(500).send('Erro ao pesquisar colaborador');
        }

        if (result.length > 0) {
            res.json(result[0]); // Retorna o primeiro colaborador encontrado
        } else {
            res.json(null); // Nenhum colaborador encontrado
        }
    });
});


// Rota para obter treinamentos de um colaborador por ID
app.get('/treinamentos/:id', (req, res) => {
    const colaboradorId = req.params.id;
    const query = `
        SELECT * FROM treinamentos
        WHERE colaborador_id = ?
    `;
    db.query(query, [colaboradorId], (err, result) => {
        if (err) {
            res.status(500).send('Erro ao buscar treinamentos');
        } else {
            res.json(result);
        }
    });
});

const qrcode = require('qrcode');

// Rota para gerar QR Code
app.get('/qrcode/:id', async (req, res) => {
    const colaboradorId = req.params.id;
    const url = `http://localhost:3000/visualizar.html?id=${colaboradorId}`;
    
    try {
        const qrCodeImage = await qrcode.toDataURL(url);
        res.send(`<img src="${qrCodeImage}" alt="QR Code">`);
    } catch (err) {
        res.status(500).send('Erro ao gerar QR Code');
    }
});

// Função para atualizar o status dos treinamentos
function atualizarStatusTreinamentos() {
    const query = `SELECT id, data_fim FROM treinamentos`;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao buscar treinamentos:', err);
            return;
        }

        const hoje = new Date();

        result.forEach(treinamento => {
            const dataFim = new Date(treinamento.data_fim);
            const diffTime = dataFim - hoje; // Diferença em milissegundos
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  // Diferença em dias

            let novoStatus = 'ativo';

            if (dataFim <= hoje) {
                novoStatus = 'vencido';  // Data final atingida ou ultrapassada
            } else if (diffDays <= 90) {  // 3 meses = 90 dias
                novoStatus = 'vencendo';  // Faltam menos de 3 meses
            }

            // Atualizar o status no banco de dados se ele mudou
            const updateQuery = `UPDATE treinamentos SET status = ? WHERE id = ?`;
            db.query(updateQuery, [novoStatus, treinamento.id], (err, updateResult) => {
                if (err) {
                    console.error('Erro ao atualizar status do treinamento:', err);
                } else {
                    console.log(`Treinamento ID ${treinamento.id} atualizado para ${novoStatus}`);
                }
            });
        });
    });
}

// Função para inserir treinamentos
function inserirTreinamentos(colaboradorId, treinamentos, res) {
    if (treinamentos && treinamentos.length > 0) {
        let processed = 0; // Contador para monitorar quando todos os treinamentos forem processados
        let errors = []; // Para armazenar quaisquer erros

        treinamentos.forEach(treinamento => {
            // Verifica se o treinamento já existe, comparando apenas a data (ignorando horas)
            const checkTreinamentoQuery = `
                SELECT id FROM treinamentos 
                WHERE colaborador_id = ? 
                AND nome = ? 
                AND DATE(data_fim) = DATE(?)  
                AND status = ?
            `;
            db.query(checkTreinamentoQuery, [colaboradorId, treinamento.nome, treinamento.data_fim, treinamento.status], (err, trainingResult) => {
                if (err) {
                    console.error('Erro ao verificar treinamento:', err);
                    errors.push(`Erro ao verificar treinamento ${treinamento.nome}`);
                }

                if (trainingResult.length === 0) {
                    // Treinamento não existe, insere novo treinamento
                    const insertTreinamentoQuery = `
                        INSERT INTO treinamentos (colaborador_id, nome, descricao, data_inicio, data_fim, status)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    db.query(insertTreinamentoQuery, [colaboradorId, treinamento.nome, treinamento.descricao, treinamento.data_inicio, treinamento.data_fim, treinamento.status], (err) => {
                        if (err) {
                            console.error('Erro ao cadastrar treinamentos', err);
                            errors.push(`Erro ao cadastrar treinamento ${treinamento.nome}`);
                        }
                    });
                } else {
                    console.log(`Treinamento ${treinamento.nome} já existe para o colaborador com ID ${colaboradorId}`);
                }

                // Incrementa o contador de itens processados
                processed++;

                // Verifica se todos os treinamentos foram processados antes de enviar a resposta
                if (processed === treinamentos.length) {
                    if (errors.length > 0) {
                        return res.status(500).json({ message: 'Alguns treinamentos não foram inseridos', errors });
                    } else {
                        return res.status(201).send({ message: 'Colaborador e treinamentos cadastrados com sucesso', colaboradorId });
                    }
                }
            });
        });
    } else {
        // Se não houver treinamentos, responde imediatamente
        return res.status(201).send({ message: 'Colaborador cadastrado sem treinamentos', colaboradorId });
    }
}

// Agendar a função para rodar a cada 1 minuto
schedule.scheduleJob('*/1 * * * *', () => {  // Cronograma: a cada minuto
    atualizarStatusTreinamentos();
});

// Configuração do Multer para upload de arquivos
const upload = multer({ dest: 'uploads/' });

// Rota para upload do arquivo Excel
app.post('/upload-excel', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // Lendo o arquivo Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Processa os dados do Excel
    sheet.forEach(row => {
        const { nome, matricula, ...treinamentos } = row;

        // Verifica se o colaborador já existe pela matrícula
        const checkColaboradorQuery = `SELECT id FROM colaboradores WHERE matricula = ?`;
        db.query(checkColaboradorQuery, [matricula], (err, result) => {
            if (err) {
                console.error('Erro ao verificar colaborador:', err);
                return res.status(500).send('Erro ao verificar colaborador');
            }

            let colaboradorId;

            if (result.length > 0) {
                // Colaborador já existe, usa o ID retornado
                colaboradorId = result[0].id;
            } else {
                // Colaborador não existe, insere novo colaborador
                const insertColaboradorQuery = `INSERT INTO colaboradores (nome, matricula) VALUES (?, ?)`;
                db.query(insertColaboradorQuery, [nome, matricula], (err, insertResult) => {
                    if (err) {
                        console.error('Erro ao inserir colaborador:', err);
                        return res.status(500).send('Erro ao inserir colaborador');
                    }
                    colaboradorId = insertResult.insertId;
                });
            }

            // Após garantir que temos o colaboradorId, insere os treinamentos
            Object.keys(treinamentos).forEach((key, index) => {
                const treinamento = treinamentos[key];
                const [nomeTreinamento, descricao, data_inicio, data_fim, status] = treinamento.split(';');

                // Verifica se o treinamento já existe para o colaborador
                const checkTreinamentoQuery = `
                    SELECT id FROM treinamentos 
                    WHERE colaborador_id = ? AND nome = ? AND data_fim = ? AND status = ?
                `;
                db.query(checkTreinamentoQuery, [colaboradorId, nomeTreinamento, data_fim, status], (err, trainingResult) => {
                    if (err) {
                        console.error('Erro ao verificar treinamento:', err);
                        return;
                    }

                    if (trainingResult.length === 0) {
                        // Treinamento não existe, insere novo treinamento
                        const insertTreinamentoQuery = `
                            INSERT INTO treinamentos (colaborador_id, nome, descricao, data_inicio, data_fim, status)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `;
                        db.query(insertTreinamentoQuery, [colaboradorId, nomeTreinamento, descricao, data_inicio, data_fim, status], (err) => {
                            if (err) {
                                console.error('Erro ao inserir treinamento:', err);
                            }
                        });
                    } else {
                        console.log(`Treinamento ${nomeTreinamento} já existe para o colaborador com matrícula ${matricula}`);
                    }
                });
            });
        });
    });

    res.status(201).send('Colaboradores e treinamentos inseridos com sucesso');
});

// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
