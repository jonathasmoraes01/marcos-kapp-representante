/* Consulta pública; os dados só são gravados após o usuário salvar o cliente. */
window.iniciarConsultaCnpj = function(form) {
  const documento = form.elements.namedItem('document');
  const botao = form.querySelector('#consultarCnpj');
  const estado = form.querySelector('#cnpjStatus');
  const campos = ['legal','fantasy','phone','email','zip','street','number','complement','district','city','region'];
  let timer, controle, sequencia = 0;
  const normalizar = valor => valor.trim().toUpperCase().replace(/[.\/\-\s]/g, '');
  const valido = valor => /^[0-9A-Z]{12}[0-9]{2}$/.test(valor);
  const mensagem = texto => { if (form.isConnected) estado.textContent = texto; };
  function cancelar() { clearTimeout(timer); sequencia++; controle?.abort(); controle = null; botao.disabled = false; }
  async function consultar(manual = false) {
    const cnpj = normalizar(documento.value);
    if (!valido(cnpj)) { if (manual) mensagem('Informe um CNPJ completo com 14 caracteres. Para CPF, preencha os dados manualmente.'); return; }
    cancelar();
    const atual = sequencia, inicial = Object.fromEntries(campos.map(nome => [nome, form.elements.namedItem(nome).value]));
    controle = new AbortController();
    const requisicao = controle;
    const limite = setTimeout(() => requisicao.abort(), 12000);
    botao.disabled = true;
    mensagem('Consultando CNPJ...');
    try {
      const resposta = await fetch('https://brasilapi.com.br/api/cnpj/v1/' + encodeURIComponent(cnpj), {signal: requisicao.signal});
      if (resposta.status === 404) throw new Error('CNPJ não encontrado. Confira o número ou preencha manualmente.');
      if (resposta.status === 400 || resposta.status === 422) throw new Error('CNPJ inválido. Confira o número ou preencha manualmente.');
      if (!resposta.ok) throw new Error('Consulta indisponível no momento. Tente novamente ou preencha manualmente.');
      const dados = await resposta.json();
      if (!form.isConnected || atual !== sequencia || normalizar(documento.value) !== cnpj) return;
      if (!dados || !dados.razao_social || (dados.cnpj && normalizar(String(dados.cnpj)) !== cnpj)) throw new Error('Não foi possível confirmar os dados. Preencha manualmente.');
      const tipo = String(dados.descricao_tipo_de_logradouro || '').trim();
      const logradouro = String(dados.logradouro || '').trim();
      const rua = tipo && logradouro && !logradouro.toUpperCase().startsWith(tipo.toUpperCase() + ' ') ? tipo + ' ' + logradouro : logradouro;
      const valores = {legal:dados.razao_social, fantasy:dados.nome_fantasia, phone:dados.ddd_telefone_1, email:dados.email, zip:dados.cep, street:rua, number:dados.numero, complement:dados.complemento, district:dados.bairro, city:dados.municipio, region:dados.uf};
      let preenchidos = 0;
      for (const nome of campos) {
        const campo = form.elements.namedItem(nome), valor = valores[nome];
        if (!inicial[nome].trim() && !campo.value.trim() && valor != null && String(valor).trim()) { campo.value = String(valor).trim(); preenchidos++; }
      }
      mensagem(preenchidos ? 'Dados encontrados e campos vazios preenchidos. Confira antes de salvar.' : 'Consulta concluída. Seus campos preenchidos foram preservados.');
    } catch (erro) {
      if (atual !== sequencia || !form.isConnected) return;
      mensagem(erro.name === 'AbortError' ? 'A consulta demorou demais. Tente novamente ou preencha manualmente.' : (erro.message && !/fetch|network/i.test(erro.message) ? erro.message : 'Não foi possível consultar. Verifique a conexão ou preencha manualmente.'));
    } finally {
      clearTimeout(limite);
      if (atual === sequencia && form.isConnected) { controle = null; botao.disabled = false; }
    }
  }
  documento.addEventListener('input', () => {
    cancelar();
    mensagem('');
    if (valido(normalizar(documento.value))) timer = setTimeout(() => consultar(), 500);
  });
  botao.addEventListener('click', () => consultar(true));
};
