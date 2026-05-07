// API Serverless para integração com Brevo
// Deploy na Vercel com variável de ambiente BREVO_API_KEY

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { email, name } = req.body;

    // Validação básica
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    // Extrair primeiro e último nome
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Chamar API do Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          NOME: name
        },
        listIds: [3],
        updateEnabled: true
      })
    });

    // Verificar resposta
    if (brevoResponse.ok || brevoResponse.status === 201 || brevoResponse.status === 204) {
      return res.status(200).json({ 
        success: true, 
        message: 'Cadastro realizado com sucesso!' 
      });
    }

    // Tratar contato duplicado
    const errorData = await brevoResponse.json();
    if (errorData.code === 'duplicate_parameter') {
      return res.status(200).json({ 
        success: true, 
        message: 'Você já está na lista!' 
      });
    }

    // Erro genérico do Brevo
    console.error('Erro Brevo:', errorData);
    return res.status(500).json({ 
      error: 'Erro ao processar cadastro',
      details: errorData.message 
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
