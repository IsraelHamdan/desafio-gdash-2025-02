/* eslint-disable prettier/prettier */
import { WeatherInsightDto } from '$/DTO/insights/insights.dto';
import { WeatherIntakeDto } from '$/DTO/weather/weatherIntake.dto';
import {
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WeatherMetrics {
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  tempAmplitude: number;
  willRain: boolean;
  maxWindspeed: number;
}

interface AIResponse {
  summary: string;
  clothingAdvice: string;
  clothingDetails: string[];
  tags: string[];
}

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

  constructor(private readonly config: ConfigService) {
    const apiKey: string = config.get<string>('GEMINI_API_KEY') || '';

    if (!apiKey) {
      this.logger.warn('🛑🛑🛑 SEM API_KEY do Gemini 🛑🛑🛑');
      this.isAIEnabled = false;
    } else {
      this.isAIEnabled = true;
      this.logger.log('✅ Google Gemini AI habilitado');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  private calculateMetrics(weatherData: WeatherIntakeDto) {
    const temps: number[] = weatherData.hourly.map((h) => h.temperature);
    const windspeeds: number[] = weatherData.hourly.map((h) => h.windspeed);
    const precipitations: number[] = weatherData.hourly.map(
      (h) => h.precipitation,
    );

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tempAmplitude = maxTemp - minTemp;
    const willRain = precipitations.some((p) => p > 0.1);
    const maxWindspeed = Math.max(...windspeeds);

    return {
      minTemp: Math.round(minTemp * 10) / 10,
      maxTemp: Math.round(maxTemp * 10) / 10,
      avgTemp: Math.round(avgTemp * 10) / 10,
      tempAmplitude: Math.round(tempAmplitude * 10) / 10,
      willRain,
      maxWindspeed: Math.round(maxWindspeed * 10) / 10,
    };
  }

  private buildPrompt(
    weatherData: WeatherIntakeDto,
    metrics: WeatherMetrics,
  ): string {
    const { current, location } = weatherData;

    return `Você é um assistente meteorológico especializado em recomendar vestimentas adequadas.

Dados atuais de ${location.city}, ${location.state}:
- Temperatura atual: ${current.temperature}°C (sensação térmica: ${current.apparentTemperature}°C)
- Umidade: ${current.humidity}%
- Velocidade do vento: ${current.windspeed} km/h
- Precipitação: ${current.precipitation} mm
- É dia: ${current.isDay ? 'Sim' : 'Não'}

Métricas das próximas horas:
- Temperatura mínima: ${metrics.minTemp}°C
- Temperatura máxima: ${metrics.maxTemp}°C
- Temperatura média: ${metrics.avgTemp}°C
- Amplitude térmica: ${metrics.tempAmplitude}°C
- Vai chover: ${metrics.willRain ? 'Sim' : 'Não'}
- Vento máximo: ${metrics.maxWindspeed} km/h

Com base nesses dados, gere um insight de vestimenta. Responda APENAS com um JSON válido no seguinte formato:

{
  "summary": "Resumo do clima em 1-2 frases",
  "clothingAdvice": "Conselho principal de vestimenta em 1 frase curta",
  "clothingDetails": [
    "Item 1 de roupa sugerido",
    "Item 2 de roupa sugerido",
    "Item 3 de roupa sugerido"
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Regras:
- NÃO mencione marcas ou propagandas
- Sugira apenas TIPOS de vestimentas (ex: "casaco leve", "camiseta", "guarda-chuva")
- Tags devem ser simples (ex: "frio", "chuva", "vento_forte", "calor")
- clothingDetails deve ter 3-5 itens
- Seja objetivo e prático

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
      const parsed = JSON.parse(cleaned) as AIResponse;
      if (!parsed.summary || !parsed.clothingAdvice) {
        throw new Error('Resposta da IA incompleta');
      }

      return {
        summary: parsed.summary,
        clothingAdvice: parsed.clothingAdvice,
        clothingDetails: parsed.clothingDetails || [],
        tags: parsed.tags || [],
      };
    } catch (error) {
      this.logger.error('Erro ao fazer parse da resposta da IA', error);
      // Fallback
      return {
        summary: 'Não foi possível gerar resumo automático.',
        clothingAdvice: 'Verifique a temperatura e vista-se adequadamente.',
        clothingDetails: ['Roupa confortável', 'Calçado adequado'],
        tags: ['clima_indefinido'],
      };
    }
  }

  async generateWeatherInsights(
    data: WeatherIntakeDto,
  ): Promise<WeatherInsightDto> {
    this.validateWeatherData(data);
    try {
      const metrics: WeatherMetrics = this.calculateMetrics(data);

      //SE NÃO CONSEGUIR USAR A API_KEY CHAMAMOS UM FALLBACK, PARA GERAR OS DADOS CONDICIONALMENTE
      if (!this.isAIEnabled) {
        return this.generateBasicInsights(data, metrics);
      }

      const prompt: string = this.buildPrompt(data, metrics);

      const aiResponse = await this.callGemini(prompt);

      const insight: WeatherInsightDto = {
        date: new Date(),
        metrics,
        summary: aiResponse.summary,
        clothingAdvice: aiResponse.clothingAdvice,
        clothingDetails: aiResponse.clothingDetails,
        tags: aiResponse.tags,
      };

      return insight;
    } catch (err) {
      this.logger.error('Erro ao gerar insights de IA', err);
      // Fallback: retorna insights básicos sem IA
      if (this.isGoogleAPIError(err)) {
        this.logger.error(`Google API Error: ${err.message}`, err.stack);
      }
      const metrics: WeatherMetrics = this.calculateMetrics(data);
      return this.generateBasicInsights(data, metrics);
    }
  }

  private validateWeatherData(data: WeatherIntakeDto): void {
    if (!data.hourly || data.hourly.length === 0) {
      throw new BadRequestException('Dados horários não fornecidos ou vazios');
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
    const temp = metrics.avgTemp;

    let summary = '';
    let clothingAdvice = '';
    let clothingDetails: string[] = [];
    let tags: string[] = [];

    if (temp < 15) {
      summary = 'Clima frio. Proteja-se bem.';
      clothingAdvice = 'Vista roupas quentes e agasalhos.';
      clothingDetails = [
        'Casaco pesado',
        'Calça comprida',
        'Cachecol',
        'Luvas (opcional)',
      ];
      tags = ['frio', 'agasalho'];
    } else if (temp < 25) {
      summary = 'Clima ameno e agradável.';
      clothingAdvice = 'Roupas leves são suficientes.';
      clothingDetails = [
        'Camiseta',
        'Calça leve ou jeans',
        'Tênis',
        'Jaqueta leve (opcional)',
      ];
      tags = ['ameno', 'confortavel'];
    } else {
      summary = 'Clima quente. Hidrate-se bem.';
      clothingAdvice = 'Use roupas frescas e leves.';
      clothingDetails = [
        'Camiseta leve',
        'Bermuda ou calça leve',
        'Chinelo ou tênis respirável',
        'Boné ou chapéu',
        'Óculos de sol',
      ];
      tags = ['calor', 'hidratacao', 'protecao_solar'];
    }

    // Adiciona itens extras baseado em condições
    if (metrics.willRain) {
      clothingDetails.push('Guarda-chuva ou capa de chuva');
      tags.push('chuva');
    }

    if (metrics.maxWindspeed > 30) {
      clothingDetails.push('Jaqueta corta-vento');
      tags.push('vento_forte');
    }

    if (data.current.humidity > 80) {
      tags.push('umidade_alta');
    }

    return {
      date: new Date(),
      metrics,
      summary,
      clothingAdvice,
      clothingDetails,
      tags,
    };
  }
}
