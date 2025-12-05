/* eslint-disable prettier/prettier */
import { Guardian } from '$/auth/guards/auth-guard/auth-guard.guard';
import { ZodValidationPipe } from '$/commom/pipes/zod-validation.pipe';
import { WeatherInsightDto } from '$/DTO/insights/insights.dto';
import { LocationDTO, locationSchema } from '$/DTO/weather/location.dto';
import { ExportDataDTO, exportDataSchema, WeatherRequestResponseDto } from '$/DTO/weather/weather.dto';
import { WeatherIntakeDto, weatherIntakeSchema } from '$/DTO/weather/weatherIntake.dto';
import { ExportService } from '$/services/export/export.service';
import { InsigthsService } from '$/services/insigths/insigths.service';
import { WeatherService } from '$/services/weather/weather.service';
import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply } from 'fastify/types/reply';


@Controller('weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name)
  constructor(
      private readonly weatherService: WeatherService,
      private readonly insightSerivice: InsigthsService,
      private readonly exportService: ExportService
  ) {}

  @UseGuards(Guardian)
  @Post('requestWeather')
  async requestWeather(
    @Body(new ZodValidationPipe(locationSchema)) data: LocationDTO,
  ): Promise<WeatherRequestResponseDto> {
    try {
      return await this.weatherService.requestWeather(data);
    } catch (err) {
      if (err instanceof BadRequestException)
        throw new BadRequestException(err.message);

      this.logger.error(`Erro ao buscar dados climáticos: ${err}`)
      throw new InternalServerErrorException(err);
    }
  }

  @Post('intake')
  async intakeData(
    @Body(new ZodValidationPipe(weatherIntakeSchema)) data: WeatherIntakeDto,
  ) {
    try {
      return await this.weatherService.handleIntake(data);
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw new BadRequestException(err.message);
      }
      throw new InternalServerErrorException(err);
    }
  }


  @UseGuards(Guardian)
  @Post('insight')
  async getInsight(
    @Body(new ZodValidationPipe(weatherIntakeSchema)) data: WeatherIntakeDto
  ): Promise<WeatherInsightDto | null > {
    try { 

      return await this.insightSerivice.generateWeatherInsights(data)
    } catch(err) {
      this.logger.error(err)
      if(err instanceof BadRequestException) {
        throw new BadRequestException(err.message)
      }
      throw new InternalServerErrorException(err)
    }
  }

  @UseGuards(Guardian)
  @Post('export/xlsx')
  async exportExcel(
    @Body(new ZodValidationPipe(exportDataSchema)) 
    body: ExportDataDTO, 
    @Res() res: FastifyReply
  ) {
    try { 
      const buffer = await this.exportService.generateExcel(body)

      res
        .header(
          'content-disposition', 
          'attachment; filename="weather_export.xlsx"'
        )
        .type(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .send(buffer)
    } catch(err) {
      this.logger.error('Erro ao exportar .xlsx', err)

      if(err instanceof BadRequestException) {
        throw new BadRequestException(err.message)
      }

      throw new InternalServerErrorException('Erro ao exportar XLSX');

    }
  }


  @UseGuards(Guardian)
  @Post('export/csv')
  async exportCSV(
    @Body(new ZodValidationPipe(exportDataSchema)) data: ExportDataDTO,
    @Res() res: FastifyReply
  ) {
    try { 
      const buffer = await this.exportService.generateCSV(data)

      res
        .header(
          'content-disposition', 
          'attachment; filename="weather_export.xlsx"'
        )
        .type(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .send(buffer)
    } catch(err) {
      this.logger.error('Erro ao exportar .xlsx', err)

      if(err instanceof BadRequestException) {
        throw new BadRequestException(err.message)
      }

      throw new InternalServerErrorException('Erro ao exportar XLSX');
    }
  }
}
