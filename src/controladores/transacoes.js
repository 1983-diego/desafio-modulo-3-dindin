const pool = require("../conexao")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const senhajwt = require("../senhajwt");
const { stringify } = require("uuid");

const listarTransacoes = async (req, res) => {
    try {
        const transacoes = await pool.query(`
            select * from transacoes where usuario_id = $1`, 
            [req.usuario.id])

        return res.json(transacoes.rows)

    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}

const listarTransacaoPorID = async (req, res) => {
    const {id} = req.params

    try {
        const transacao = await pool.query(`
            select * from transacoes where id = $1`,
            [id])

        if (transacao.rowCount === 0) {
            return res.status(404).json({mensagem: "Transação não encontrada."})
        }

        return res.json(transacao.rows)

    } catch (error) {

        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}

const cadastrarUmaTransacao = async (req, res) => {
    const {descricao, valor, data, categoria_id, tipo} = req.body

    if (!descricao || !valor || !data ||!categoria_id || !tipo) {
        return res.status(400).json({mensagem: "Os campos descricao, valor, data, categoria_id e tipo são obrigatórios."})
    }

    if (tipo !== "entrada" && tipo !== "saida") {
        return res.status(400).json({mensagem: "O campo tipo precisa ser entrada ou saida."})
    }

    try {
        const inserirTransacao = await pool.query(`
            insert into transacoes (descricao, valor, data, categoria_id, usuario_id, tipo)
            values ($1, $2, $3, $4, $5, $6) returning *`, 
            [descricao, valor, data, categoria_id, req.usuario.id, tipo])


        return res.status(201).json(inserirTransacao.rows)

    } catch (error) {

        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}

const atualizarTransacaoUsuarioLogado = async (req, res) => {
    const {id} = req.params
    const {descricao, valor, data, categoria_id, tipo} = req.body

    if (!descricao || !valor || !data ||!categoria_id || !tipo) {
        return res.status(400).json({mensagem: "Os campos descricao, valor, data, categoria_id e tipo são obrigatórios."})
    }

    if (tipo !== "entrada" && tipo !== "saida") {
        return res.status(400).json({mensagem: "O campo tipo precisa ser entrada ou saida."})
    }
        

    try {
        const encontrarTransacao = await pool.query(`
            select * from transacoes where id = $1 and usuario_id = $2`,
            [id, req.usuario.id])

        if (encontrarTransacao.rowCount === 0) {
            return res.status(404).json({ mensagem: "Transação não encontrada"})
        }

        await pool.query(`
            update transacoes set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 where id = $6`,
            [descricao, valor, data, categoria_id, tipo, id])

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }


}

const excluirTransacao = async (req, res) => {
    const {id} = req.params

    try {
        const encontrarTransacao = await pool.query(`
            select * from transacoes where id = $1 and usuario_id = $2`,
            [id, req.usuario.id])

        if (encontrarTransacao.rowCount === 0) {
            return res.status(404).json({ mensagem: "Transação não encontrada"})
        }

        await pool.query(`
            delete from transacoes where id = $1`,
        [id])

        return res.status(204).send()
    } catch (error) {
        
        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}       
        
const extrato = async (req, res) => {
    
    try {
        const entrada = await pool.query(`
            select sum(valor) from transacoes where usuario_id = $1 and tipo = $2`,
        [req.usuario.id, "entrada"])

        const saida = await pool.query(`
            select sum(valor) from transacoes where usuario_id = $1 and tipo = $2`,
        [req.usuario.id, "saida"])
        
        
        return res.json({
            entrada: entrada.rows[0].sum, 
            saida: saida.rows[0].sum
        })

    } catch (error) {
        
        return res.status(500).json({mensagem: "Erro interno do servidor"})
    }
}

//fica apenas como consulta, caso queira implementar subistituir esse código
// no endpoint listarTransacoes
const extra = async (req, res) => {
    const { usuario } = req;
    const { filtro } = req.query;

    if (filtro && !Array.isArray(filtro)) {
        return res.status(400).json({ mensagem: 'O filtro precisa ser um array' });
    }

    try {
        let queryLike = '';
        let arrayFiltro;

        if (filtro) {
            arrayFiltro = filtro.map((item) => `%${item}%`);
            queryLike += `and c.descricao ilike any($2)`;
        }

        const queryTransacoes = `
            select t.*, c.descricao as categoria_nome from transacoes t 
            left join categorias c 
            on t.categoria_id = c.id 
            where t.usuario_id = $1 
            ${queryLike}
        `;

        const paramFiltro = filtro ? [usuario.id, arrayFiltro] : [usuario.id];

        const transacoes = await query(queryTransacoes, paramFiltro);
        return res.json(transacoes.rows);
    } catch (error) {
        return res.status(500).json({ mensagem: `Erro interno: ${error.message}` });
    }
}

module.exports = {
    listarTransacoes,
    listarTransacaoPorID,
    cadastrarUmaTransacao,
    atualizarTransacaoUsuarioLogado,
    excluirTransacao,
    extrato,

}