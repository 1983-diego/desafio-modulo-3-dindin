const pool = require("../conexao")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const senhajwt = require("../senhajwt")


const listarCategorias = async (req, res) => {
    try {
        const categorias = await pool.query(`
        select * from categorias`)

        return res.json(categorias.rows)
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}

module.exports = listarCategorias