let configVazia = {
  isStandalone: 'STANDALONE',
  apiHost: "127.0.0.1",
  apiPort: 8626,
  httpHttps: "http"
};

let config = configVazia
export const carregarConfigJson = async () => {
  try {
    const response = await fetch('/config.json')
    const data = await response.json()
    config.isStandalone = data.REACT_APP_MODE;
    config.apiPort = data.REACT_APP_API_PORT;
    config.apiHost = data.REACT_APP_API_HOST;
    config.httpHttps =  data.REACT_APP_HTTP_OU_HTTPS
  } catch (error) {
    console.error("Erro ao carregar o arquivo de configuração:", error)
  }
};

export default config