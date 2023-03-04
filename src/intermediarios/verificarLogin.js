const senhajwt = require("../senhajwt")
const pool = require("../conexao")
const jwt = require("jsonwebtoken")


const verificarLogin = async (req, res, next) => {
    const {authorization} = req.headers

    if (!authorization){
        return res.status(401).json({ mensagem: "Usuário não logado."})
    }

    const token = authorization.split(" ")[1]

    try {
        const {id} = jwt.verify(token, senhajwt)

        const {rows, rowCount} = await pool.query(`
        select * from usuarios where id = $1`, [id])

        if (rowCount === 0) {
            return res.status(401).json({ mensagem: "Usuário não autorizado"})
        }

        const { senha:_, ...user} = rows[0]

        req.usuario = user
        
        next()
        
    } catch (error) {
        
        return res.status(401).json({mensagem: "Para acessar este recurso um token de autenticação válido deve ser enviado."})
    }

}

module.exports = verificarLogin