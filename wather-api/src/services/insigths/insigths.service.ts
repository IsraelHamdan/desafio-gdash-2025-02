/* eslint-disable prettier/prettier */
import { AIResponse, AIResponseSchema, WeatherInsightDto, WeatherMetrics } from '$/DTO/insights/insights.dto';
import { WeatherIntakeDto } from '$/DTO/weather/weatherIntake.dto';
import { WeatherInsight, WeatherInsightDocument } from '$/schemas/insights/insight.schema';
import {
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, } from 'mongoose';
import { calculateWeatherMetrics } from '$/services/insigths/weatherMetrics.utils';
import { ZodError } from 'zod/v4';

interface GoogleAPIError extends Error {
  status?: number;
  statusText?: string;
  errorDetails?: unknown;
}

@Injectable()
export class InsigthsService {
  private readonly logger = new Logger(InsigthsService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly isAIEnabled: boolean;

  constructor(
      private readonly config: ConfigService,

    @InjectModel(WeatherInsight.name)
    private readonly weatherInsight: Model<WeatherInsightDocument>
  ) {
    const apiKey: string = config.get<string>('GEMINI_API_KEY') || '';

    if (!apiKey) {
      this.logger.warn('🛑🛑🛑 SEM API_KEY do Gemini 🛑🛑🛑');
      this.isAIEnabled = false;
    } else {
      this.isAIEnabled = true;
      this.logger.log('✅ Google Gemini AI habilitado');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }




  private buildPrompt(
      weatherData: WeatherIntakeDto,
      metrics: WeatherMetrics,
    ): string {
      // Acessando o primeiro ponto do array 'daily' (o dia de hoje)
      if (!weatherData.daily || weatherData.daily.length === 0) {
        // Retorna uma mensagem de erro robusta
        return 'Erro: Dados diários de previsão não disponíveis. Gere um aviso de clima desconhecido.';
      }
        
      const dailyData = weatherData.daily[0];
      const { current, location } = weatherData;
      const { temperature, precipitation, wind } = metrics; // <--- AGORA USANDO precipitation e wind de METRICS

      // Conversores (assumindo segundos para horas, padrão do Open-Meteo)
      const sunHours = (dailyData.sunshineDuration / 3600).toFixed(1);
      const daylightHours = (dailyData.daylightDuration / 3600).toFixed(1);
      const sunriseTime = new Date(dailyData.sunrise).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const sunsetTime = new Date(dailyData.sunset).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return `Você é um Consultor Especialista em Sistemas Fotovoltaicos. 
  Sua missão é gerar insights para dois públicos: o CONSUMIDOR FINAL (que precisa de dicas práticas de uso) e o TÉCNICO/ENGENHEIRO (que precisa de dados de eficiência).

  Local: ${location.city}, ${location.state}
  Condição Atual: ${current.isDay ? 'Dia (Janela de Geração Ativa)' : 'Noite (Geração Inativa)'}

  --- DADOS CRÍTICOS (METRICS + DAILY[0]) ---

  1. POTENCIAL DE GERAÇÃO SOLAR:
    - Horas de Sol Pleno (Daily): ${sunHours}h (Principal fator de geração)
    - Duração da Luz Total (Daily): ${daylightHours}h
    - Janela de Geração (Daily): ${sunriseTime} até ${sunsetTime}
    - UV Máximo (Metrics): ${metrics.radiation.uvIndexMax}

  2. EFICIÊNCIA E TEMPERATURA:
    - Temperatura Máxima (Daily): ${dailyData.temperatureMax}°C (Sensação Máxima: ${dailyData.apparentTemperatureMax}°C)
    - Amplitude Térmica (Metrics): ${temperature.amplitude}°C

  3. CONDIÇÕES ADVERSAS E VENTO:
    - Vai Chover (Metrics): ${precipitation.willRain ? 'Sim' : 'Não'} 
    - Probabilidade Máxima (Daily): ${dailyData.precipitationProbabilityMax}%
    - Chuva Acumulada (Daily): ${dailyData.rainSum}mm
    - Total Precipitação (Metrics): ${precipitation.totalPrecipitation.toFixed(1)}mm
    - Vento Máximo (Metrics): ${wind.maxSpeed10m.toFixed(1)} km/h
    - Rajada Máxima (Daily): ${dailyData.windGusts10mMax} km/h (Efeito resfriamento)

  INSTRUÇÕES DE ANÁLISE:
  - A irradiação (Horas de Sol e UV) é o fator principal.
  - Temp Máx > 30°C causa perda de eficiência (nota técnica).
  - Vento Alto (Rajadas > 30 km/h) ajuda a mitigar a perda térmica por resfriamento.
  - O campo 'consumerAdvice' deve ser prático (Ex: 'Ligar o ar-condicionado').

  Responda APENAS com um JSON válido NO FORMATO SOLAR (campos de vestuário substituídos):
  {
    "summary": "Resumo amigável de 1-2 frases para o consumidor",
    "productionForecast": "Previsão qualitativa de geração (use apenas: 'Muito Alta', 'Média' ou 'Baixa')",
    "consumerAdvice": "Dica prática de consumo e economia (1-2 frases)",
    "technicalNote": "Nota técnica para o engenheiro/instalador (mencione perdas, ganhos por irradiação e eficiência)",
    "tags": ["tag_tecnica", "tag_consumo"]
  }

  Regras Específicas:
  - productionForecast deve ser 'Muito Alta' se Horas de Sol Pleno > 6h e Temp Máx < 30°C.
  - productionForecast deve ser 'Baixa' se Chuva Acumulada > 5mm OU se 'Vai Chover' for 'Sim' e Horas de Sol Pleno < 3h.

  JSON:`;
  }

  private parseAIResponse(text: string): AIResponse {
      try {
        let cleaned = text.trim();
        
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```\n?/g, '');
        }
        
        const rawParsed:unknown = JSON.parse(cleaned);

        const parsed = AIResponseSchema.parse(rawParsed); 

        return {
          summary: parsed.summary,
          productionForecast: parsed.productionForecast,
          consumerAdvice: parsed.consumerAdvice,
          technicalNote: parsed.technicalNote || 'Dados técnicos adicionais não fornecidos pela IA.',
          tags: parsed.tags || [],
        };
        
      } catch (error) {
        
        let errorMessage: string;

        if (error instanceof ZodError) {
            errorMessage = `Erro de validação de Schema: ${error.message}`
            this.logger.error(errorMessage, error);
        } else if (error instanceof SyntaxError) {
            errorMessage = 'Erro de sintaxe. A IA não retornou JSON formatado corretamente.';
            this.logger.error(errorMessage, error);
        } else {
            errorMessage = 'Erro desconhecido durante o processamento da resposta da IA.';
            this.logger.error(errorMessage, error);
        }
        
        return {
          summary: '⚠️ Análise automática indisponível. Erro no parse.',
          productionForecast: 'Média', // Retorna um valor seguro
          consumerAdvice: 'Monitore seu inversor. Não foi possível planejar o consumo.',
          technicalNote: `Falha na validação dos dados da IA: ${errorMessage.substring(0, 100)}...`,
          tags: ['erro_schema', 'fallback_seguro'],
        };
      }
  }
  
  async generateWeatherInsights(
    data: WeatherIntakeDto,
  ): Promise<WeatherInsightDto> {
    this.validateWeatherData(data);
    try {
      const metrics: WeatherMetrics = calculateWeatherMetrics(data);

      //SE NÃO CONSEGUIR USAR A API_KEY CHAMAMOS UM FALLBACK, PARA GERAR OS DADOS CONDICIONALMENTE
      if (!this.isAIEnabled) {
        return this.generateBasicInsights(data, metrics);
      }

      const prompt: string = this.buildPrompt(data, metrics);

      const aiResponse = await this.callGemini(prompt);

      const insight: WeatherInsightDto = {
        date: new Date(),
        summary: aiResponse.summary,
        productionForecast: aiResponse.productionForecast,
        consumerAdvice: aiResponse.consumerAdvice, 
        technicalNote: aiResponse.technicalNote,
        tags: aiResponse.tags || [],
      };
      return insight;
    } catch (err) {
      this.logger.error('Erro ao gerar insights de IA', err);
      // Fallback: retorna insights básicos sem IA
      if (this.isGoogleAPIError(err)) {
        this.logger.error(`Google API Error: ${err.message}`, err.stack);
      }
      const metrics: WeatherMetrics = calculateWeatherMetrics(data);
      return this.generateBasicInsights(data, metrics);
    }
  }

  private validateWeatherData(data: WeatherIntakeDto): void {
    if (!data.hourly || data.hourly.length === 0) {
      throw new BadRequestException('Dados horários não fornecidos ou vazios');
    }

    if(!data.daily) {
      throw new BadRequestException('Dados diarios não fornecidos ou vazios');

    }

    if (!data.current) {
      throw new BadRequestException('Dados atuais não fornecidos');
    }

    if (!data.location) {
      throw new BadRequestException('Localização não fornecida');
    }
  }

  private async callGemini(prompt: string): Promise<AIResponse> {
    try {
      const result: GenerateContentResult =
        await this.model.generateContent(prompt);

      const text = result.response.text();

      if (!text) throw new Error('Resposta vazia da API do Google');

      return this.parseAIResponse(text);
    } catch (err) {
      if (this.isGoogleAPIError(err)) {
        if (err.message?.includes('quota')) {
          this.logger.warn('⚠️  Quota da API excedida - usando fallback');
          throw new Error('QUOTA_EXCEEDED');
        }
        if (
          err.message?.includes('API key') ||
          err.message?.includes('invalid')
        ) {
          this.logger.error('❌ API Key inválida');
          throw new Error('INVALID_API_KEY');
        }

        if (
          err.message?.includes('network') ||
          err.message?.includes('ECONNREFUSED')
        ) {
          this.logger.error('❌ Erro de conexão com Google API');
          throw new Error('NETWORK_ERROR');
        }
      }
      throw new BadRequestException(err);
    }
  }

  private isGoogleAPIError(error: unknown): error is GoogleAPIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    );
  }

  // somente será usado em caso de erro na API do google!
  private generateBasicInsights(
    data: WeatherIntakeDto,
    metrics: WeatherMetrics,
  ): WeatherInsightDto {
  
    if (!data.daily || data.daily.length === 0) {
      return {
          date: new Date(),
          summary: 'Erro de dados: Previsão diária não encontrada.',
          productionForecast: 'Baixa',
          consumerAdvice: 'Sistema indisponível para análise. Verifique a fonte de dados.',
          technicalNote: 'Array daily[0] está vazio.',
          tags: ['erro_fatal'],
      };
    }

    const dailyData = data.daily[0];
    
    // Variáveis solares-chave de DAILY (dados brutos de hoje)
    const sunHoursToday = dailyData.sunshineDuration / 3600;
    const uvMaxToday = dailyData.uvIndexMax; 
    const tempMaxToday = dailyData.temperatureMax; 
    const windGustsToday = dailyData.windGusts10mMax; 
    
    // Variáveis de MÉTRICAS (dados agregados/flags)
    const avgSunshineHours = metrics.radiation.avgSunshineHours; 
    const willRain = metrics.precipitation.willRain; 
    const totalRain = metrics.precipitation.totalRain;
    const maxTempAggregate = metrics.temperature.max; 
    const maxWindSpeed = metrics.wind.maxSpeed10m;

    // 2. NOVOS CAMPOS DE SAÍDA
    let summary = '';
    let productionForecast = '';
    let consumerAdvice = '';
    let technicalNote = '';
    let tags: string[] = [];

    // 3. LÓGICA DE DECISÃO SOLAR

    // CENÁRIO 1: Geração Baixa (Chuva ou Sol Mínimo) 🌧️
    if (willRain || sunHoursToday < 3 || avgSunshineHours < 4) {
      summary = 'Dia com pouca irradiação solar. Geração será limitada.';
      productionForecast = 'Baixa';
      consumerAdvice = 'A produção será mínima. **Evite usar grandes eletrodomésticos** para depender menos da rede elétrica.';
      technicalNote = `Irradiação fraca (UV Máx: ${uvMaxToday}). Horas de Sol Hoje (${sunHoursToday.toFixed(1)}h) muito abaixo da média (${avgSunshineHours.toFixed(1)}h). Total de chuva: ${totalRain.toFixed(1)}mm. Flag 'willRain' ativada.`;
      tags = ['baixa_geracao', 'economia_energia'];
      
      if (totalRain > 2) {
          technicalNote += ' Chuva prevista para autolimpeza dos módulos.';
          tags.push('autolimpeza');
      }
    } 
    
    // CENÁRIO 2: Geração Alta (Sol Forte) ☀️
    else if (uvMaxToday >= 6 && sunHoursToday >= 5) {
        
      // Sub-Cenário 2A: Sol Forte + Calor Extremo (> 30°C)
      if (maxTempAggregate > 30) {
        summary = 'Muito sol! A geração será alta, mas a eficiência térmica cairá.';
        productionForecast = 'Alta';
        consumerAdvice = 'Pode usar aparelhos de alto consumo. **Priorize ligar o Ar-Condicionado** ou o aquecedor de piscina no pico (11h-15h).';
        technicalNote = `Alta irradiação (UV: ${uvMaxToday}). Perdas devido ao coeficiente de temperatura (Temp Máx Agregada: ${maxTempAggregate.toFixed(1)}°C; Temp Painel: ${tempMaxToday.toFixed(1)}°C).`;
        tags = ['alta_geracao', 'perda_termica', 'pode_gastar'];
      } 
        
      // Sub-Cenário 2B: Sol Forte + Temperatura Agradável (< 30°C)
      else {
        summary = 'O dia perfeito para a sua usina solar! Máxima eficiência esperada.';
        productionForecast = 'Muito Alta';
        consumerAdvice = '**Carregue seus dispositivos e use máquinas pesadas agora** para aproveitar o excedente de energia.';
        technicalNote = `Condições ideais. Alta irradiação (UV: ${uvMaxToday}) e temperatura controlada. Horas de sol superior à média (${avgSunshineHours.toFixed(1)}h).`;
        tags = ['pico_maximo', 'eficiencia_ideal', 'excedente_energia'];
      }
    } 
    
    // CENÁRIO 3: Geração Média (Sol Moderado/Inverno) 🌤️
    else {
      summary = 'Geração solar moderada e estável.';
      productionForecast = 'Média';
      consumerAdvice = 'Consumo normal. Evite ligar dois grandes aparelhos simultaneamente no mesmo horário.';
      technicalNote = `Geração estável. Irradiação (UV: ${uvMaxToday}) e horas de sol (${sunHoursToday.toFixed(1)}h) dentro da média esperada.`;
      tags = ['producao_normal', 'estabilidade'];
    }

    // 4. AJUSTES FINAIS BASEADOS EM VENTO (USANDO AMBOS DAILY E METRICS)
    if (windGustsToday > 30 || maxWindSpeed > 25) {
      technicalNote += ` Vento forte (Máx Média: ${maxWindSpeed.toFixed(1)} km/h; Rajada: ${windGustsToday.toFixed(1)} km/h) ajudando ativamente no resfriamento dos painéis.`;
      if (!tags.includes('perda_termica')) {
          tags.push('ganho_vento');
      }
    }
    
    // 5. RETORNO DO NOVO DTO
    return {
      date: new Date(),
      summary,
      productionForecast,
      consumerAdvice,
      technicalNote,
      tags,
    };
  }
}
