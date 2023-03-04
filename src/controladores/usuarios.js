const pool = require("../conexao")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const senhajwt = require("../senhajwt")

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body

    if (!nome || !email ||!senha) {
        return res.status(400).json({mensagem: "Os campos nome, email e senha são obrigatórios."})
    }

    try {
        const emailUnico = await pool.query(`
            select * from usuarios where email = $1`, 
        [email])
        
        if (emailUnico.rowCount > 0) {
            return res.status(400).json({mensagem: "Já existe usuário cadastrado com o e-mail informado."})
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const novoUsuario = await pool.query(
            `insert into usuarios (nome, email, senha) 
            values ($1, $2, $3) returning *` ,
        [nome, email, senhaCriptografada])

        const {senha:_, ...user} = novoUsuario.rows[0]
        
        return res.status(201).json(user)

    } catch (error) {

        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}

const loginUsuario = async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({mensagem: "OS campos email e senha são obrigatórios."})
    }

    try {
        const verificarEmail = await pool.query(`
        select * from usuarios where email = $1`,
        [email])

        if (verificarEmail.rowCount < 1) {
            return res.status(404).json({mensagem: "Usuário e/ou senha inválido(s)."})
        } 

        const verificarSenha = await bcrypt.compare(senha, verificarEmail.rows[0].senha)

        if (!verificarSenha){
            return res.status(404).json({mensagem: "Usuário e/ou senha inválido(s)."})
        }

        const token = jwt.sign({id: verificarEmail.rows[0].id}, 
            senhajwt, 
            {expiresIn: "6h"})

        const {senha:_, ... user} = verificarEmail.rows[0]

        return res.status(200).json({usuario: user, token})
       
    } catch (error) {

        return res.status(500).json({ mensagem: "Erro interno do servidor"})
    }
}

const detalharUsuario = async (req, res) => {
    
    try {
        await pool.query(`
        select * from usuarios where id = $1` [req.usuario.id])

        return res.status(200).json({
            id: req.usuario.id,
            nome: req.usuario.nome,
            email: req.usuario.email
        })
    } catch (error) {

        return res.status(500).json(error)
    }
}

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body
    
    if (!nome || !email || !senha) {
        return res.status(400).json({mensagem: "Os campos nome, email e senha são obrigatórios."})
    }

    try {
        const checarEmail = await pool.query(`
        select * from usuarios where email = $1`,
        [email])

        if (checarEmail.rowCount == 0 || checarEmail.rowCount > 0 && req.usuario.id == checarEmail.rows[0].id) {
            const senhaNova = await bcrypt.hash(senha, 10)
        
            await pool.query('update usuarios set nome = $1, email = $2, senha = $3 where id = $4', 
            [nome, email, senhaNova, req.usuario.id])

            return res.status(201).json()
        }

        return res.status(400).json({ mensagem: "O e-mail informado já está sendo utilizado por outro usuário."})
        
    } catch (error) {
        return res.status(500).json({mensagem: "Erro interno do servidor"})
    }
}

module.exports = {
    cadastrarUsuario,
    loginUsuario,
    detalharUsuario,
    atualizarUsuario
}