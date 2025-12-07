/* eslint-disable prettier/prettier */
import { ExportDataDTO } from '$/DTO/weather/weather.dto';
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';

@Injectable()
export class ExportService {

  async generateCSV(data: ExportDataDTO): Promise<Buffer> {
    const {log, location, insight} = data; 
    const workbook = new Workbook()
    const sheet = workbook.addWorksheet('CSV');

    sheet.addRow([
      'city',
      'state',
      'countryCode',
      'lat',
      'lon',
      'time',
      'temperature',
      'humidity',
      'windspeed',
      'precipitation',
      'insight_summary',
      'insight_clothingAdvice',
    ]);

    // Dados
    for (const h of log.hourly) {
      sheet.addRow([
        location.city,
        location.state,
        location.countryCode,
        location.lat,
        location.lon,
        h.time.toISOString(),
        h.temperature,
        h.humidity,
        h.windspeed,
        h.precipitation,
        (insight?.summary ?? '').replace(/,/g, ' '),
        (insight?.clothingAdvice ?? '').replace(/,/g, ' '),
      ]);
    }

    const buffer = await workbook.csv.writeBuffer()
    return Buffer.from(buffer)
  }

  async generateExcel(data: ExportDataDTO): Promise<Buffer> {
    const workbook = new Workbook()

    const {log, insight, location} = data

    this.addSummarySheet(workbook, log, location, insight)
    this.addMetricsSheet(workbook, insight)
    this.addCurrentSheet(workbook, log, location)
    this.addHourlySheet(workbook, log)

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  private addSummarySheet(
    workbook: Workbook,
    log: ExportDataDTO['log'], 
    location: ExportDataDTO['location'], 
    insight?: ExportDataDTO['insight'] | null
  ): void {
    const sheet = workbook.addWorksheet('Resumo')
    
    sheet.addRow(['Cidade', location.city]);
    sheet.addRow(['Estado', location.state]);
    sheet.addRow(['País', location.countryCode]);
    sheet.addRow(['Latitude', location.lat]);
    sheet.addRow(['Longitude', location.lon]);
    sheet.addRow([]);
    sheet.addRow(['Requested At', log.requestedAt.toISOString()]);
    sheet.addRow([]);
    sheet.addRow(['Resumo do Insight']);
    sheet.addRow([insight?.summary ?? 'N/A']);
    sheet.addRow([]);
    sheet.addRow(['Dica principal de vestimenta']);
    sheet.addRow([insight?.clothingAdvice ?? 'N/A']);
    sheet.addRow([]);
    sheet.addRow(['Tags']);
    sheet.addRow([insight?.tags?.join(', ') ?? 'N/A']);
  }

  private addMetricsSheet(
    workbook: Workbook,
    insight?: ExportDataDTO['insight'] | null,
  ): void {
    if (!insight) return;

    const sheet = workbook.addWorksheet('Métricas');

    sheet.addRow([
      'Data Insight',
      'Min Temp',
      'Max Temp',
      'Avg Temp',
      'Amplitude',
      'Vai chover?',
      'Vento máx.',
    ]);

    sheet.addRow([
      insight.date.toISOString(),
      insight.metrics.minTemp,
      insight.metrics.maxTemp,
      insight.metrics.avgTemp,
      insight.metrics.tempAmplitude,
      insight.metrics.willRain ? 'Sim' : 'Não',
      insight.metrics.maxWindspeed,
    ]);
  }

  private addHourlySheet(
    workbook: Workbook,
    log: ExportDataDTO['log'],
  ): void {
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

}
