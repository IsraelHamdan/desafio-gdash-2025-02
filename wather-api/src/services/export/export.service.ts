/* eslint-disable prettier/prettier */
import { ExportDataDTO } from '$/DTO/weather/weather.dto';
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';

@Injectable()
export class ExportService {
  async generateCSV(data: ExportDataDTO): Promise<Buffer> {
    const { log, location } = data;
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('CSV');

    sheet.addRow([
      'city',
      'state',
      'countryCode',
      'lat',
      'lon',
      'requestedAt',
      'time',
      'temperature',
      'humidity',
      'windspeed',
      'precipitation',
    ]);

    for (const h of log.hourly) {
      sheet.addRow([
        location.city,
        location.state,
        location.countryCode,
        location.lat,
        location.lon,
        log.requestedAt.toISOString(),
        h.time.toISOString(),
        h.temperature,
        h.humidity,
        h.windspeed,
        h.precipitation,
      ]);
    }

    const buffer = await workbook.csv.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateExcel(data: ExportDataDTO): Promise<Buffer> {
    const workbook = new Workbook();

    const { log, location } = data;

    this.addSummarySheet(workbook, log, location);
    this.addCurrentSheet(workbook, log, location);
    this.addHourlySheet(workbook, log);
    this.addDailySheet(workbook, log);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  
  private addSummarySheet(
    workbook: Workbook,
    log: ExportDataDTO['log'],
    location: ExportDataDTO['location'],
  ): void {
    const sheet = workbook.addWorksheet('Resumo');

    sheet.addRow(['Cidade', location.city]);
    sheet.addRow(['Estado', location.state]);
    sheet.addRow(['País', location.countryCode]);
    sheet.addRow(['Latitude', location.lat]);
    sheet.addRow(['Longitude', location.lon]);
    sheet.addRow([]);

    sheet.addRow(['Requested At', log.requestedAt.toISOString()]);
    sheet.addRow(['Total registros horários', log.hourly.length]);
    sheet.addRow(['Total registros diários', log.daily?.length ?? 0]);

    if (log.hourly.length > 0) {
      const first = log.hourly[0].time;
      const last = log.hourly[log.hourly.length - 1].time;
      sheet.addRow([]);
      sheet.addRow(['Primeiro horário', first.toISOString()]);
      sheet.addRow(['Último horário', last.toISOString()]);
    }
  }

  private addHourlySheet(workbook: Workbook, log: ExportDataDTO['log']): void {
    const sheet = workbook.addWorksheet('Horário');

    sheet.addRow([
      'Hora',
      'Temperatura',
      'Umidade',
      'Vento',
      'Precipitação',
    ]);

    for (const h of log.hourly) {
      sheet.addRow([
        h.time.toISOString(),
        h.temperature,
        h.humidity,
        h.windspeed,
        h.precipitation,
      ]);
    }
  }
  private addCurrentSheet(
    workbook: Workbook,
    log: ExportDataDTO['log'],
    location: ExportDataDTO['location'],
  ): void {
    const sheet = workbook.addWorksheet('Atual');

    sheet.addRow([
      'Cidade',
      'Estado',
      'País',
      'Lat',
      'Lon',
      'Temperatura',
      'Sensação',
      'Umidade',
      'Vento',
      'Precipitação',
      'Hora',
      'É dia?',
    ]);

    sheet.addRow([
      location.city,
      location.state,
      location.countryCode,
      location.lat,
      location.lon,
      log.current.temperature,
      log.current.apparentTemperature,
      log.current.humidity,
      log.current.windspeed,
      log.current.precipitation,
      log.current.time.toISOString(),
      log.current.isDay ? 'Sim' : 'Não',
    ]);
  }


  private addDailySheet(workbook: Workbook, log: ExportDataDTO['log']): void {
    const sheet = workbook.addWorksheet('Diário');

    sheet.addRow([
      'Data',
      'Temp Máx',
      'Temp Mín',
      'Sensação Máx',
      'Sensação Mín',
      'UV Máx',
      'UV Céu Limpo Máx',
      'Prob. Precip. Máx',
      'Precipitação (soma)',
      'Chuva (soma)',
      'Neve (soma)',
      'Nascer do sol',
      'Pôr do sol',
      'Duração do dia (s)',
      'Duração de sol (s)',
      'Vento 10m Máx',
      'Vento 10m Mín',
      'Rajadas 10m Máx',
      'Rajadas 10m Mín',
      'Direção vento 10m dominante',
      'Umidade 2m Máx',
      'Umidade 2m Mín',
      'Umidade 2m Média',
    ]);

    if (!log.daily?.length) return;

    for (const d of log.daily) {
      sheet.addRow([
        d.time.toISOString(),
        d.temperatureMax,
        d.temperatureMin,
        d.apparentTemperatureMax,
        d.apparentTemperatureMin,
        d.uvIndexMax,
        d.uvIndexClearSkyMax,
        d.precipitationProbabilityMax,
        d.precipitationSum,
        d.rainSum,
        d.snowfallSum,
        d.sunrise.toISOString(),
        d.sunset.toISOString(),
        d.daylightDuration,
        d.sunshineDuration,
        d.windSpeed10mMax,
        d.windSpeed10mMin,
        d.windGusts10mMax,
        d.windGusts10mMin,
        d.windDirection10mDominant,
        d.relativeHumidity2mMax,
        d.relativeHumidity2mMin,
        d.relativeHumidity2mMean,
      ]);
    }
  }
}
