/* eslint-disable prettier/prettier */
import { Guardian } from '$/auth/guards/auth-guard/auth-guard.guard';
import { ZodValidationPipe } from '$/commom/pipes/zod-validation.pipe';
import { LocationDTO, locationSchema } from '$/DTO/weather/location.dto';
import { WeatherRequestResponseDto } from '$/DTO/weather/weather.dto';
import {
  WeatherIntakeDto,
  weatherIntakeSchema,
} from '$/DTO/weather/weatherIntake.dto';
import { WeatherService } from '$/services/weather/weather.service';
import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('weather')
export class WeatherController {
  constructor(private readonly service: WeatherService) {}

  @UseGuards(Guardian)
  @Post('requestWeather')
  async requestWeather(
    @Body(new ZodValidationPipe(locationSchema)) data: LocationDTO,
  ): Promise<WeatherRequestResponseDto> {
    try {
      return await this.service.requestWeather(data);
    } catch (err) {
      if (err instanceof BadRequestException)
        throw new BadRequestException(err.message);
      throw new InternalServerErrorException(err);
    }
  }

  @Post('intake')
  async intakeData(
    @Body(new ZodValidationPipe(weatherIntakeSchema)) data: WeatherIntakeDto,
  ) {
    try {
      return await this.service.handleIntake(data);
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw new BadRequestException(err.message);
      }
      throw new InternalServerErrorException(err);
    }
  }
}
