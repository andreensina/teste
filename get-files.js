// api/get-files.js - Coloque este arquivo na pasta /api

export default async function handler(req, res) {
  // Configurações
  const GITHUB_USER = "andreensina";
  const GITHUB_REPO = "dados";
  const GITHUB_PATH = "";  // Deixe vazio para a raiz do repositório

  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    return res.status(500).json({ 
      error: 'Token do GitHub não configurado. Configure GITHUB_TOKEN nas variáveis de ambiente.' 
    });
  }

  // Extensões permitidas
  const videoExt = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const allowedExt = [...videoExt, ...imageExt];

  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
    
    console.log('Buscando arquivos do GitHub:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Media-Repository-App'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do GitHub:', response.status, errorText);
      throw new Error(`Erro do GitHub (${response.status}): ${response.statusText}`);
    }

    const files = await response.json();
    
    if (!Array.isArray(files)) {
      throw new Error('Resposta inesperada da API do GitHub');
    }

    console.log(`Total de arquivos encontrados: ${files.length}`);

    // Filtrar apenas arquivos de mídia
    const mediaFiles = files
      .filter(file => {
        if (file.type !== 'file' || !file.name) {
          return false;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        return allowedExt.includes(ext);
      })
      .map(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        const type = videoExt.includes(ext) ? 'video' : 'image';
        
        return {
          id: file.sha,
          type: type,
          url: file.download_url,
          title: file.name,
          path: file.path,
          date: new Date().toISOString().split('T')[0],
          size: file.size
        };
      });

    console.log(`Arquivos de mídia válidos: ${mediaFiles.length}`);

    // Cache por 10 minutos
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json(mediaFiles);
    
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Verifique se o token do GitHub está correto e tem permissões de leitura no repositório'
    });
  }
}