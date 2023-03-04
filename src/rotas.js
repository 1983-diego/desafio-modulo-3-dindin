const express = require("express")
const listarCategorias = require("./controladores.js/categorias")
const { listarTransacoes, listarTransacaoPorID, cadastrarUmaTransacao, atualizarTransacaoUsuarioLogado, excluirTransacao, extrato } = require("./controladores.js/transacoes")
const { cadastrarUsuario, loginUsuario, detalharUsuario, atualizarUsuario } = require("./controladores.js/usuarios")
const verificarLogin = require("./intermediarios.js/verificarLogin")
const rotas = express()

rotas.post("/usuario", cadastrarUsuario)
rotas.post("/login", loginUsuario)

rotas.use(verificarLogin)

rotas.get("/usuario", detalharUsuario)
rotas.put("/usuario", atualizarUsuario)

rotas.get("/categoria", listarCategorias)

rotas.get("/transacao/extrato", extrato)
rotas.get("/transacao", listarTransacoes)
rotas.get("/transacao/:id", listarTransacaoPorID)
rotas.post("/transacao", cadastrarUmaTransacao)
rotas.put("/transacao/:id", atualizarTransacaoUsuarioLogado)
rotas.delete("/transacao/:id", excluirTransacao)




module.exports = rotas