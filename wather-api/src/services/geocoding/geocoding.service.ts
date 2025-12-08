/* eslint-disable prettier/prettier */
import { LocationDTO } from '$/DTO/weather/location.dto';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export type GeocodingResult = {
  city: string;
  state: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
};

type OpenMeteoGeocodingResult = {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code: string;
  admin1?: string;
  admin1_id?: number;
  timezone: string;
  population?: number;
  country?: string;
};

export type OpenMeteoGeocodingResponse = {
  results?: OpenMeteoGeocodingResult[];
  generationtime_ms?: number;
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name)
  constructor(
      private readonly http: HttpService,
  ) {}

  private normalize(str: string | undefined | null): string {
    return (str ?? '').trim().toLocaleLowerCase()
  }

  async resolveLocation(data: LocationDTO): Promise<GeocodingResult> {
    try { 
      const results = await this.getGeocodingDataWithRetry(data)

      const bestMatch = this.pickBestMatch(results, data.state, data.countryCode)

      return {
        city: bestMatch.name,
        state: bestMatch.admin1 ?? data.state,
        countryCode: bestMatch.country_code,
        lat: bestMatch.latitude,
        lon: bestMatch.longitude,
        timezone: bestMatch.timezone,
      }

    } catch(err) {
      this.logger.error(`Erro ao buscar dados de geolocalização ${err}`)

      if(err instanceof HttpException) throw err

      throw new InternalServerErrorException(`Erro interno na busca de geolocalização`)
    }
  }

  private async getGeocodingData(
    dto: LocationDTO,
  ): Promise<OpenMeteoGeocodingResult[]> {
    const url = 'https://geocoding-api.open-meteo.com/v1/search';

    try {
      const res = await firstValueFrom(
        this.http.get<OpenMeteoGeocodingResponse>(url, {
          params: {
            name: dto.city,
            count: 10,
            language: 'pt',
            format: 'json',
            countryCode: dto.countryCode,
          },
        }),
      );

      const data = res.data;
      const results = data.results ?? [];

      if (!results.length) {
        throw new NotFoundException(
          `Localização não encontrada: city=${dto.city}, state=${dto.state}, country=${dto.countryCode}`,
        );
      }

      return results;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      if (err instanceof AxiosError) {
        this.logger.error(
          `[GeocodingService] Erro HTTP ao chamar Open-Meteo: status=${
            err.response?.status
          } data=${JSON.stringify(err.response?.data)}`,
        );

        const status = err.response?.status;

        if (status && status >= 400 && status < 500) {
          throw new NotFoundException(
            `Localização inválida ou não encontrada: city=${dto.city}, state=${dto.state}, country=${dto.countryCode}`,
          );
        }

        throw new ServiceUnavailableException(
          'Serviço de geocodificação indisponível no momento',
        );
      }

      this.logger.error(
        `[GeocodingService] Erro desconhecido ao consultar geocoding: ${err}`,
      );
      throw new ServiceUnavailableException(
        'Erro ao consultar API de geocodificação',
      );
    }
  }

  private getExpectedAdmin1 (
    state: string, 
    countryCode: string
  ): string | undefined {
    const nState = this.normalize(state);
    const nCountry = this.normalize(countryCode);

    if(!nState) return undefined

    if(nCountry === 'br') {
      return BRAZIL_STATE_MAP[state.toLocaleUpperCase()] ?? state
    }

    return state
  }

   private isRetryableError(err: unknown): boolean {
    // Se for uma HttpException nossa:
    if (err instanceof NotFoundException) {
      // entrada ruim / cidade inexistente → não adianta tentar de novo
      return false;
    }

    if (err instanceof ServiceUnavailableException) {
      // vindo de erro 5xx / Axios / rede → vale a pena tentar de novo
      return true;
    }

    // erros desconhecidos: prefere NÃO ficar em loop
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getGeocodingDataWithRetry(
    dto: LocationDTO,
  ): Promise<OpenMeteoGeocodingResult[]> {
    const maxAttempts = 10;
    const baseDelayMs = 500; // meio segundo

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          this.logger.warn(
            `[GeocodingService] Tentativa ${attempt}/${maxAttempts} para ${dto.city}, ${dto.state}-${dto.countryCode}`,
          );
        }

        return await this.getGeocodingData(dto);
      } catch (err) {

        // se não for erro retryable, já aborta
        if (!this.isRetryableError(err) || attempt === maxAttempts) {
          throw err;
        }

        const delay = baseDelayMs * attempt; // backoff linear: 500ms, 1000ms, 1500ms
        this.logger.warn(
          `[GeocodingService] Erro retryable na tentativa ${attempt}, aguardando ${delay}ms antes de tentar novamente...`,
        );
        await this.sleep(delay);
      }
    }

    throw new ServiceUnavailableException('Erro de geocoding');
  }



  private pickBestMatch(
    results: OpenMeteoGeocodingResult[],
    state: string,
    countryCode: string
  ): OpenMeteoGeocodingResult {
      const nCountry = this.normalize(countryCode)
      const expectedAdmin1 = this.getExpectedAdmin1(state, countryCode)

      let bestMatch: OpenMeteoGeocodingResult | undefined

      if(expectedAdmin1) {
        const nExpected = this.normalize(expectedAdmin1)

        bestMatch = results.find((r) => {
          const rCountry = this.normalize(r.country_code)
          const rAdmin1 = this.normalize(r.admin1)

          return rCountry === nCountry && rAdmin1 === nExpected
        })
      }

      if (!bestMatch) {
          bestMatch = results.find(
            (r) => this.normalize(r.country_code) === nCountry,
          );
      }
      
      if(!bestMatch) {
        bestMatch = results[0]
      }
      return bestMatch
  }


} // end of class


const BRAZIL_STATE_MAP: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};